"use client";

/**
 * use-coding-voice Hook
 * 
 * Bridges IDE events to the voice agent.
 * Instead of calling a separate analysis API, it sends structured context
 * directly to the voice agent via WebSocket - instant, no rate limiting.
 * 
 * The voice agent (Grok) receives context like:
 * - "Candidate wrote: [code]. Tests: 2/3 passing. They seem stuck on edge cases."
 * - "Candidate clicked help button"
 * - "5 minutes remaining"
 * 
 * And decides whether to speak based on the situation.
 */

import { useEffect, useCallback, useRef } from "react";
import {
  codingEventBus,
  type CodingEvent,
  type CodeDeltaData,
  type TestResultData,
  type HelpRequestedData,
  type TimeCheckpointData,
  type IdleTimerData,
} from "@/lib/coding-events";

interface UseCodingVoiceOptions {
  sendContext: (context: string, options?: { triggerResponse?: boolean }) => void;
  isConnected: boolean;
  enabled?: boolean;
}

export function useCodingVoice({
  sendContext,
  isConnected,
  enabled = true,
}: UseCodingVoiceOptions) {
  // Track last code sent to avoid spamming
  const lastCodeSentRef = useRef<string>("");
  const lastTestResultRef = useRef<string>("");

  /**
   * Format code delta into context for voice agent
   */
  const formatCodeContext = useCallback((data: CodeDeltaData): string => {
    const lines = data.code.split("\n").length;
    return `[IDE UPDATE] Candidate's current code (${data.language}, ${lines} lines):
\`\`\`${data.language}
${data.code}
\`\`\`
Change: ${data.summary}`;
  }, []);

  /**
   * Format test result into context for voice agent
   */
  const formatTestContext = useCallback((data: TestResultData): string => {
    if (data.status === "pass") {
      return `[TEST RESULT] All ${data.totalTests} tests passing. Solution appears correct.`;
    }

    const failDetails = data.failingTests
      ?.map((t) => `- ${t.name}: Input ${t.input} → Expected ${t.expected}, Got ${t.actual}`)
      .join("\n") || "";

    return `[TEST RESULT] ${data.passedTests}/${data.totalTests} tests passing.
Failing tests:
${failDetails}`;
  }, []);

  /**
   * Handle events and send to voice agent
   */
  const handleEvent = useCallback(
    (event: CodingEvent) => {
      if (!enabled || !isConnected) return;

      switch (event.type) {
        case "code_delta": {
          const data = event.data as CodeDeltaData;
          // Only send if code meaningfully changed
          const codeKey = data.code.trim();
          if (codeKey === lastCodeSentRef.current) return;
          lastCodeSentRef.current = codeKey;

          const context = formatCodeContext(data);
          sendContext(context, { triggerResponse: false });
          break;
        }

        case "test_result": {
          const data = event.data as TestResultData;
          // Always send test results (important for hints)
          const resultKey = `${data.passedTests}/${data.totalTests}`;
          if (resultKey === lastTestResultRef.current) return;
          lastTestResultRef.current = resultKey;

          const context = formatTestContext(data);
          // Trigger response if tests failed (candidate might need help)
          // Also trigger if all tests pass (agent can acknowledge and potentially end early)
          sendContext(context, { triggerResponse: true });
          break;
        }

        case "help_requested": {
          const data = event.data as HelpRequestedData;
          sendContext(
            `[HELP REQUESTED] Candidate asked for help via ${data.channel}.`,
            { triggerResponse: true }
          );
          break;
        }

        case "time_checkpoint": {
          const data = event.data as TimeCheckpointData;
          sendContext(
            `[TIME WARNING] ${data.minutesLeft} minutes remaining.`,
            { triggerResponse: true }
          );
          break;
        }

        case "idle_timer_fired": {
          const data = event.data as IdleTimerData;
          sendContext(
            `[IDLE DETECTED] Candidate has been idle for ${Math.round(data.idleForMs / 1000)} seconds after failing tests.`,
            { triggerResponse: true }
          );
          break;
        }

        case "session_started": {
          // Don't send - voice agent already has problem context
          break;
        }
      }
    },
    [enabled, isConnected, sendContext, formatCodeContext, formatTestContext]
  );

  // Subscribe to EventBus
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = codingEventBus.subscribe(handleEvent);
    console.log("[Coding Voice] Subscribed to EventBus");

    return () => {
      unsubscribe();
      console.log("[Coding Voice] Unsubscribed from EventBus");
    };
  }, [enabled, handleEvent]);
}

