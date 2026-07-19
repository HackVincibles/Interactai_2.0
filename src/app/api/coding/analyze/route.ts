/**
 * Real-time Code Analysis API
 * 
 * Uses Grok Code Fast 1 to analyze candidate's code and provide
 * structured JSON describing their state, approach, and suggested hints.
 * 
 * This runs continuously during the coding round, feeding the voice agent
 * with context about what the candidate is doing.
 */

import { NextResponse } from "next/server";
import type {
  CodeAnalysisRequest,
  CandidateAnalysis,
} from "@/lib/code-analysis-types";

const XAI_API_KEY = process.env.XAI_API_KEY || "";
const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";

// Use Grok Code Fast 1 for real-time code analysis
const GROK_CODE_FAST_MODEL = "grok-code-fast-1";

export async function POST(request: Request) {
  try {
    const body: CodeAnalysisRequest = await request.json();
    const {
      sessionId,
      problemId,
      problemTitle,
      problemDescription,
      constraints,
      code,
      language,
      lastTestResult,
      minutesElapsed,
      minutesRemaining,
      previousState,
    } = body;

    if (!code) {
      return NextResponse.json(
        { error: "No code provided" },
        { status: 400 }
      );
    }

    if (!XAI_API_KEY) {
      console.warn("[Code Analysis] XAI_API_KEY not configured, returning mock analysis");
      return NextResponse.json(getMockAnalysis());
    }

    // Build test results string
    let testResultsStr = "No tests run yet";
    if (lastTestResult) {
      if (lastTestResult.passedTests === lastTestResult.totalTests) {
        testResultsStr = `✅ All ${lastTestResult.totalTests} tests passing!`;
      } else {
        testResultsStr = `${lastTestResult.passedTests}/${lastTestResult.totalTests} tests passing\n\nFailing tests:\n`;
        lastTestResult.failingTests.forEach((t, i) => {
          testResultsStr += `${i + 1}. Input: ${t.input}\n   Expected: ${t.expected}\n   Got: ${t.actual}\n\n`;
        });
      }
    }

    const prompt = buildAnalysisPrompt({
      problemTitle,
      problemDescription,
      constraints: constraints.join(", "),
      language,
      code,
      testResults: testResultsStr,
      minutesElapsed,
      minutesRemaining,
      previousState: previousState || "unknown",
    });

    console.log(`[Code Analysis] Analyzing code for session ${sessionId}`);

    const response = await fetch(XAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROK_CODE_FAST_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert coding interview analyzer. Your job is to observe a candidate's code in real-time and provide structured analysis. You are like a senior engineer watching over their shoulder, understanding their approach and identifying when they might need guidance.

Key principles:
- Be Socratic - never give away answers
- Detect common patterns and anti-patterns
- Consider time pressure when assessing urgency
- Only suggest hints when genuinely helpful
- Output ONLY valid JSON`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1, // Very low for fastest, most consistent analysis
        max_tokens: 600, // Further reduced for ultra-fast response
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(8000), // 8s timeout - fail fast for responsiveness
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Code Analysis] Grok error: ${response.status} ${errorText}`);
      return NextResponse.json(getMockAnalysis());
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;

    if (!analysisText) {
      console.error("[Code Analysis] No analysis generated");
      return NextResponse.json(getMockAnalysis());
    }

    try {
      const analysis: CandidateAnalysis = {
        ...JSON.parse(analysisText),
        analyzedAt: new Date().toISOString(),
      };
      
      console.log(`[Code Analysis] State: ${analysis.state}, Approach: ${analysis.approach?.pattern}`);
      
      return NextResponse.json(analysis);
    } catch (parseError) {
      console.error("[Code Analysis] Failed to parse response:", analysisText);
      return NextResponse.json(getMockAnalysis());
    }
  } catch (error) {
    console.error("[Code Analysis] Error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

function buildAnalysisPrompt(params: {
  problemTitle: string;
  problemDescription: string;
  constraints: string;
  language: string;
  code: string;
  testResults: string;
  minutesElapsed: number;
  minutesRemaining: number;
  previousState: string;
}): string {
  return `Problem: ${params.problemTitle}
${params.problemDescription}
Constraints: ${params.constraints}

Code (${params.language}):
\`\`\`${params.language}
${params.code}
\`\`\`

Tests: ${params.testResults}
Time: ${params.minutesElapsed}m elapsed, ${params.minutesRemaining}m left
Prev: ${params.previousState}

Analyze. Output JSON only:

{
  "state": "thinking" | "writing" | "debugging" | "stuck" | "making_progress" | "off_track" | "close_to_solution" | "completed",
  "approach": {
    "pattern": "description of algorithm/approach",
    "timeComplexity": "O(...)",
    "spaceComplexity": "O(...)",
    "isViable": true/false,
    "viabilityNote": "optional note if not viable"
  },
  "issues": [
    {
      "severity": "low" | "medium" | "high",
      "type": "syntax_error" | "logic_error" | "edge_case_missed" | "inefficient_approach" | "wrong_approach" | "incomplete_solution" | "off_by_one" | "type_error" | "infinite_loop_risk",
      "description": "what's wrong",
      "lineNumbers": [optional line numbers]
    }
  ],
  "suggestedHint": {
    "trigger": "immediate" | "on_next_failure" | "on_idle" | "on_help_request" | "time_warning",
    "text": "Socratic hint text",
    "directness": 1-5,
    "priority": 1-10
  },
  "confidence": 0.0-1.0
}`;
}

function getMockAnalysis(): CandidateAnalysis {
  return {
    state: "writing",
    approach: {
      pattern: "unknown",
      timeComplexity: "unknown",
      spaceComplexity: "unknown",
      isViable: true,
    },
    issues: [],
    confidence: 0.5,
    analyzedAt: new Date().toISOString(),
  };
}

