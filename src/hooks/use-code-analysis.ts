/**
 * use-code-analysis Hook
 * 
 * Continuously analyzes candidate's code using Grok Code Fast 1.
 * Subscribes to IDE events and emits structured analysis that
 * the voice agent uses to provide contextual hints.
 * 
 * Flow:
 * code_delta/test_result → debounce → Grok API → analysis_updated event
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  codingEventBus,
  type CodingEvent,
  type CodeDeltaData,
  type TestResultData,
} from "@/lib/coding-events";
import type {
  CandidateAnalysis,
  CodeAnalysisRequest,
  CandidateState,
} from "@/lib/code-analysis-types";

interface UseCodeAnalysisOptions {
  sessionId: string;
  problemId: string;
  problemTitle: string;
  problemDescription: string;
  constraints: string[];
  enabled?: boolean;
  // How often to analyze (ms) - don't want to spam the API
  analyzeInterval?: number;
}

interface UseCodeAnalysisReturn {
  analysis: CandidateAnalysis | null;
  isAnalyzing: boolean;
  lastAnalyzedAt: string | null;
  triggerAnalysis: () => void;
}

export function useCodeAnalysis({
  sessionId,
  problemId,
  problemTitle,
  problemDescription,
  constraints,
  enabled = true,
  analyzeInterval = 1000, // Analyze every 1 second max - ultra-fast for voice responsiveness
}: UseCodeAnalysisOptions): UseCodeAnalysisReturn {
  const [analysis, setAnalysis] = useState<CandidateAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);

  // Track latest code and test results
  const latestCodeRef = useRef<{ code: string; language: string } | null>(null);
  const latestTestResultRef = useRef<TestResultData | null>(null);
  const previousStateRef = useRef<CandidateState | undefined>(undefined);
  const startTimeRef = useRef<number>(Date.now());
  const lastAnalyzedCodeRef = useRef<string>(""); // Track what we last analyzed

  // Throttle analysis calls
  const lastAnalysisTimeRef = useRef<number>(0);
  const pendingAnalysisRef = useRef<NodeJS.Timeout | null>(null);
  const inFlightRequestRef = useRef<AbortController | null>(null);
  const analysisCacheRef = useRef<Map<string, CandidateAnalysis>>(new Map());

  // Check if code meaningfully changed (ignore whitespace-only changes)
  const hasMeaningfulChange = useCallback((newCode: string): boolean => {
    const normalizedNew = newCode.trim().replace(/\s+/g, " ");
    const normalizedLast = lastAnalyzedCodeRef.current.trim().replace(/\s+/g, " ");
    return normalizedNew !== normalizedLast;
  }, []);

  const runAnalysis = useCallback(async (force = false) => {
    if (!enabled || !latestCodeRef.current) return;

    const now = Date.now();
    const timeSinceLastAnalysis = now - lastAnalysisTimeRef.current;

    // Check if code meaningfully changed
    if (!force && !hasMeaningfulChange(latestCodeRef.current.code)) {
      return; // Skip if no meaningful change
    }

    // Cancel any in-flight request (newer code takes priority)
    if (inFlightRequestRef.current) {
      inFlightRequestRef.current.abort();
      inFlightRequestRef.current = null;
    }

    // Check cache first (for identical code)
    const codeHash = latestCodeRef.current.code.trim().replace(/\s+/g, " ");
    const cached = analysisCacheRef.current.get(codeHash);
    if (cached && !force) {
      // Use cached result if available
      setAnalysis(cached);
      setLastAnalyzedAt(cached.analyzedAt);
      previousStateRef.current = cached.state;
      lastAnalyzedCodeRef.current = latestCodeRef.current.code;
      return;
    }

    // Don't analyze too frequently (unless forced, e.g., test failure)
    if (!force && timeSinceLastAnalysis < analyzeInterval) {
      // Schedule for later if not already scheduled
      if (!pendingAnalysisRef.current) {
        const delay = analyzeInterval - timeSinceLastAnalysis;
        pendingAnalysisRef.current = setTimeout(() => {
          pendingAnalysisRef.current = null;
          runAnalysis(false);
        }, delay);
      }
      return;
    }

    setIsAnalyzing(true);
    lastAnalysisTimeRef.current = now;

    // Create abort controller for this request
    const abortController = new AbortController();
    inFlightRequestRef.current = abortController;

    const minutesElapsed = Math.floor((now - startTimeRef.current) / 60000);
    const minutesRemaining = Math.max(0, 15 - minutesElapsed);

    const request: CodeAnalysisRequest = {
      sessionId,
      problemId,
      problemTitle,
      problemDescription,
      constraints,
      code: latestCodeRef.current.code,
      language: latestCodeRef.current.language,
      minutesElapsed,
      minutesRemaining,
      previousState: previousStateRef.current,
    };

    // Add test results if available
    if (latestTestResultRef.current) {
      request.lastTestResult = {
        passedTests: latestTestResultRef.current.passedTests,
        totalTests: latestTestResultRef.current.totalTests,
        failingTests: latestTestResultRef.current.failingTests?.map((t) => ({
          input: t.input,
          expected: t.expected,
          actual: t.actual,
        })) || [],
      };
    }

    try {
      const response = await fetch("/api/coding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: abortController.signal,
      });

      if (!response.ok) {
        console.error("[Code Analysis] API error:", response.status);
        return;
      }

      const newAnalysis: CandidateAnalysis = await response.json();
      
      // Check if request was cancelled
      if (abortController.signal.aborted) {
        return;
      }

      // Cache the result
      analysisCacheRef.current.set(codeHash, newAnalysis);
      // Keep cache size manageable (last 10 analyses)
      if (analysisCacheRef.current.size > 10) {
        const firstKey = Array.from(analysisCacheRef.current.keys())[0];
        if (firstKey !== undefined) {
          analysisCacheRef.current.delete(firstKey);
        }
      }

      setAnalysis(newAnalysis);
      setLastAnalyzedAt(newAnalysis.analyzedAt);
      previousStateRef.current = newAnalysis.state;

      // Emit analysis to EventBus for voice agent to consume
      codingEventBus.emit({
        type: "approach_flag",
        ts: newAnalysis.analyzedAt,
        sessionId,
        roundId: `coding-${sessionId}`,
        source: "ide",
        data: {
          severity: getAnalysisSeverity(newAnalysis),
          summary: formatAnalysisSummary(newAnalysis),
          fullAnalysis: newAnalysis,
        },
      });

      // Update last analyzed code
      lastAnalyzedCodeRef.current = latestCodeRef.current.code;

      console.log(`[Code Analysis] Updated:`, {
        state: newAnalysis.state,
        approach: newAnalysis.approach?.pattern,
        issues: newAnalysis.issues?.length || 0,
        hint: newAnalysis.suggestedHint?.text?.substring(0, 50),
      });
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === "AbortError") {
        return;
      }
      console.error("[Code Analysis] Error:", error);
    } finally {
      if (inFlightRequestRef.current === abortController) {
        inFlightRequestRef.current = null;
      }
      setIsAnalyzing(false);
    }
  }, [
    enabled,
    sessionId,
    problemId,
    problemTitle,
    problemDescription,
    constraints,
    analyzeInterval,
    hasMeaningfulChange,
  ]);

  // Subscribe to EventBus for code changes and test results
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = codingEventBus.subscribe((event: CodingEvent) => {
      if (event.type === "code_delta") {
        const data = event.data as CodeDeltaData;
        latestCodeRef.current = {
          code: data.code,
          language: data.language,
        };
        // Trigger analysis after code change (throttled)
        runAnalysis(false);
      } else if (event.type === "test_result") {
        latestTestResultRef.current = event.data as TestResultData;
        // Force immediate analysis on test results (bypass throttle)
        lastAnalysisTimeRef.current = 0;
        runAnalysis(true);
      }
    });

    return () => {
      unsubscribe();
      if (pendingAnalysisRef.current) {
        clearTimeout(pendingAnalysisRef.current);
      }
    };
  }, [enabled, runAnalysis]);

  return {
    analysis,
    isAnalyzing,
    lastAnalyzedAt,
    triggerAnalysis: () => runAnalysis(true),
  };
}

function getAnalysisSeverity(analysis: CandidateAnalysis): "low" | "med" | "high" {
  if (analysis.state === "stuck" || analysis.state === "off_track") {
    return "high";
  }
  if (analysis.issues?.some((i) => i.severity === "high")) {
    return "high";
  }
  if (analysis.state === "debugging" || analysis.issues?.length > 0) {
    return "med";
  }
  return "low";
}

function formatAnalysisSummary(analysis: CandidateAnalysis): string {
  const parts: string[] = [];

  // State
  parts.push(`State: ${analysis.state}`);

  // Approach
  if (analysis.approach) {
    parts.push(`Approach: ${analysis.approach.pattern} (${analysis.approach.timeComplexity})`);
    if (!analysis.approach.isViable) {
      parts.push(`⚠️ ${analysis.approach.viabilityNote}`);
    }
  }

  // Issues
  if (analysis.issues?.length > 0) {
    const highIssues = analysis.issues.filter((i) => i.severity === "high");
    if (highIssues.length > 0) {
      parts.push(`Issues: ${highIssues.map((i) => i.description).join("; ")}`);
    }
  }

  // Hint
  if (analysis.suggestedHint) {
    parts.push(`Hint ready: "${analysis.suggestedHint.text.substring(0, 60)}..."`);
  }

  return parts.join(" | ");
}

