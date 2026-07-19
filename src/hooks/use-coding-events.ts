/**
 * use-coding-events Hook
 * 
 * Central hook for emitting IDE events from React components.
 * Handles session initialization and provides debounced code change tracking.
 */

import { useEffect, useCallback, useRef } from "react";
import {
  codingEventBus,
  type CodingEvent,
  type CodingEventType,
  type SessionStartedData,
  type CodeDeltaData,
} from "@/lib/coding-events";

interface UseCodingEventsOptions {
  sessionId: string;
  roundId: string;
  problemId: string;
  problemTitle: string;
  problemDifficulty: "Easy" | "Medium" | "Hard";
  problemConstraints: string[];
  examplesCount: number;
  timeLimitMin: number;
}

interface UseCodingEventsReturn {
  emit: <T>(type: CodingEventType, data: T) => void;
}

/**
 * Hook for emitting coding interview events
 * 
 * Automatically emits session_started on mount.
 * Provides emit() function for components to emit events.
 */
export function useCodingEvents({
  sessionId,
  roundId,
  problemId,
  problemTitle,
  problemDifficulty,
  problemConstraints,
  examplesCount,
  timeLimitMin,
}: UseCodingEventsOptions): UseCodingEventsReturn {
  // Debounce timer for code_delta events
  const codeDeltaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 500; // 500ms - near-instant for voice agent

  // Emit session_started on mount
  useEffect(() => {
    const sessionData: SessionStartedData = {
      problemId,
      title: problemTitle,
      difficulty: problemDifficulty,
      constraints: problemConstraints,
      timeLimitMin,
      examplesCount,
    };

    const event: CodingEvent<SessionStartedData> = {
      type: "session_started",
      ts: new Date().toISOString(),
      sessionId,
      roundId,
      source: "ide",
      data: sessionData,
    };

    codingEventBus.emit(event);
  }, [
    sessionId,
    roundId,
    problemId,
    problemTitle,
    problemDifficulty,
    problemConstraints,
    timeLimitMin,
    examplesCount,
  ]);

  /**
   * Emit an event (with debouncing for code_delta)
   */
  const emit = useCallback(
    <T,>(type: CodingEventType, data: T) => {
      // Special handling for code_delta - debounce it
      if (type === "code_delta") {
        // Clear existing timer
        if (codeDeltaTimerRef.current) {
          clearTimeout(codeDeltaTimerRef.current);
        }

        // Set new timer
        codeDeltaTimerRef.current = setTimeout(() => {
          const event: CodingEvent<T> = {
            type,
            ts: new Date().toISOString(),
            sessionId,
            roundId,
            source: "ide",
            data,
          };
          codingEventBus.emit(event);
          codeDeltaTimerRef.current = null;
        }, DEBOUNCE_MS);
      } else {
        // Immediate emission for other events
        const event: CodingEvent<T> = {
          type,
          ts: new Date().toISOString(),
          sessionId,
          roundId,
          source: "ide",
          data,
        };
        codingEventBus.emit(event);
      }
    },
    [sessionId, roundId]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (codeDeltaTimerRef.current) {
        clearTimeout(codeDeltaTimerRef.current);
      }
    };
  }, []);

  return { emit };
}

