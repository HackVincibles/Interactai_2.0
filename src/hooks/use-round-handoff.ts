"use client";

/**
 * useRoundHandoff Hook
 * 
 * Handles generating and saving handoff context after each interview round.
 * Call this when:
 * - The voice agent says a closing phrase
 * - The candidate ends the interview
 * - The timer expires
 * 
 * This enables cross-round context for subsequent interviews.
 */

import { useCallback, useState } from "react";
import type { TranscriptEntry } from "@/lib/types";

interface UseRoundHandoffReturn {
  generateHandoff: (
    sessionId: string,
    roundType: "hr" | "technical" | "coding",
    transcript: TranscriptEntry[]
  ) => Promise<HandoffResult>;
  isGenerating: boolean;
  error: string | null;
}

interface HandoffResult {
  success: boolean;
  topicsDiscussed: number;
  candidateClaims: number;
  areasToExplore: number;
  positiveSignals: number;
  message: string;
}

export function useRoundHandoff(): UseRoundHandoffReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateHandoff = useCallback(async (
    sessionId: string,
    roundType: "hr" | "technical" | "coding",
    transcript: TranscriptEntry[]
  ): Promise<HandoffResult> => {
    if (transcript.length === 0) {
      return {
        success: false,
        topicsDiscussed: 0,
        candidateClaims: 0,
        areasToExplore: 0,
        positiveSignals: 0,
        message: "No transcript to analyze",
      };
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log(`%c[HANDOFF] 🔄 Generating ${roundType.toUpperCase()} round handoff...`, "color: #4CAF50; font-weight: bold; font-size: 14px");
      console.log(`%c[HANDOFF] Transcript entries: ${transcript.length}`, "color: #2196F3");

      const response = await fetch("/api/interview/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          roundType,
          transcript,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate handoff");
      }

      const data = await response.json();
      
      console.log(`%c[HANDOFF] ✅ Handoff generated successfully!`, "color: #4CAF50; font-weight: bold; font-size: 14px");
      console.log(`%c  📋 Topics: ${data.handoff.topicsDiscussed}`, "color: #9C27B0");
      console.log(`%c  🎯 Claims: ${data.handoff.candidateClaims}`, "color: #FF9800");
      console.log(`%c  🔍 Areas to explore: ${data.handoff.areasToExplore}`, "color: #03A9F4");
      console.log(`%c  ✨ Positive signals: ${data.handoff.positiveSignals}`, "color: #8BC34A");
      console.log(`%c  → This context will be passed to the next interviewer!`, "color: #607D8B; font-style: italic");

      return {
        success: true,
        topicsDiscussed: data.handoff.topicsDiscussed.length || data.handoff.topicsDiscussed,
        candidateClaims: data.handoff.candidateClaims,
        areasToExplore: data.handoff.areasToExplore,
        positiveSignals: data.handoff.positiveSignals,
        message: data.message,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`[useRoundHandoff] Error:`, errorMessage);
      setError(errorMessage);
      
      return {
        success: false,
        topicsDiscussed: 0,
        candidateClaims: 0,
        areasToExplore: 0,
        positiveSignals: 0,
        message: errorMessage,
      };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateHandoff,
    isGenerating,
    error,
  };
}

/**
 * Get existing handoff data for a session
 */
export async function getSessionHandoffs(sessionId: string) {
  try {
    const response = await fetch(`/api/interview/handoff?sessionId=${sessionId}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch handoffs");
    }
    
    return await response.json();
  } catch (error) {
    console.error("[getSessionHandoffs] Error:", error);
    return null;
  }
}
