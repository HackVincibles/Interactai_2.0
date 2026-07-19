/**
 * use-idle-timer Hook
 * 
 * Detects when the candidate has been idle (no code edits or test runs)
 * for a specified duration and triggers an event.
 * 
 * Used to detect when candidate might be stuck and needs a hint.
 */

import { useEffect, useRef, useCallback } from "react";
import type { CodingEventType } from "@/lib/coding-events";

interface UseIdleTimerOptions {
  timeout: number; // milliseconds
  onIdle: () => void;
  enabled?: boolean;
}

/**
 * Hook that fires a callback after a period of inactivity
 * 
 * Resets the timer whenever:
 * - Code changes (via reset() call)
 * - Tests are run (via reset() call)
 * - User interacts with IDE
 * 
 * @example
 * const { reset } = useIdleTimer({
 *   timeout: 90_000, // 90 seconds
 *   onIdle: () => emit("idle_timer_fired", { idleForMs: 90000 })
 * });
 * 
 * // Call reset() when code changes or tests run
 * reset();
 */
export function useIdleTimer({
  timeout,
  onIdle,
  enabled = true,
}: UseIdleTimerOptions): { reset: () => void } {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const reset = useCallback(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Reset start time
    startTimeRef.current = Date.now();

    // Set new timer if enabled
    if (enabled) {
      timerRef.current = setTimeout(() => {
        const idleDuration = Date.now() - startTimeRef.current;
        onIdle();
        timerRef.current = null;
      }, timeout);
    }
  }, [timeout, onIdle, enabled]);

  // Initialize timer on mount
  useEffect(() => {
    if (enabled) {
      reset();
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, reset]);

  return { reset };
}

