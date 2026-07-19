/**
 * IDE Event Tracking System
 * 
 * PURPOSE:
 * This module provides structured event tracking for the coding interview IDE.
 * Events are emitted by IDE components (editor, test runner, timer) and consumed
 * by the pair-programmer agent and voice agent.
 * 
 * PROBLEM IT SOLVES:
 * - Without this: Voice agent has no context about what candidate is doing
 * - With this: Voice agent receives structured events (code changes, test results, idle time)
 *   and can provide contextual hints at the right moments
 * 
 * HOW IT CONNECTS TO VOICE AGENT:
 * 1. IDE components emit events → EventBus
 * 2. use-coding-voice hook subscribes to EventBus
 * 3. When trigger conditions met (help_requested, idle after failure, time warnings),
 *    events are formatted and sent to XAI Realtime API via input_text
 * 4. Voice agent (Grok) receives context and speaks hints via speech-to-speech
 */

export type CodingEventType =
  | "session_started"
  | "code_delta"
  | "run_tests_requested"
  | "test_result"
  | "runtime_error"
  | "help_requested"
  | "idle_timer_fired"
  | "time_checkpoint"
  | "approach_flag";

export interface CodingEvent<T = unknown> {
  type: CodingEventType;
  ts: string; // ISO timestamp
  sessionId: string;
  roundId: string;
  source: "ide";
  data: T;
}

// Event-specific data types
export interface SessionStartedData {
  problemId: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  constraints: string[];
  timeLimitMin: number;
  examplesCount: number;
}

export interface CodeDeltaData {
  file: string;
  language: string;
  code: string; // Full current code - voice agent needs this to give hints
  summary: string; // e.g., "edited lines 10-18"
  diffSize: "small" | "medium" | "large";
  lineCount: number;
}

export interface TestResultData {
  status: "pass" | "fail" | "error";
  failingTests?: Array<{
    name: string;
    input: string;      // What inputs were given
    expected: string;   // What output was expected
    actual: string;     // What the candidate's code produced
    msg: string;        // Error message if any
  }>;
  durationMs: number;
  totalTests: number;
  passedTests: number;
}

export interface HelpRequestedData {
  channel: "voice" | "chat" | "button";
  text?: string;
}

export interface IdleTimerData {
  idleForMs: number;
}

export interface TimeCheckpointData {
  minutesLeft: number;
}

export interface ApproachFlagData {
  severity: "low" | "med" | "high";
  summary: string; // e.g., "O(n^2) approach; hashmap likely needed"
}

/**
 * EventBus - Pub/Sub pattern for IDE events
 * 
 * Components emit events → EventBus → Subscribers (voice agent, analytics, etc.)
 */
class CodingEventBus {
  private subscribers: Set<(event: CodingEvent) => void> = new Set();
  private eventBuffer: Map<CodingEventType, CodingEvent> = new Map();

  /**
   * Emit an event to all subscribers
   */
  emit(event: CodingEvent): void {
    // Store last event per type for voice agent to query
    this.eventBuffer.set(event.type, event);

    // Notify all subscribers
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(event);
      } catch (error) {
        console.error(`[EventBus] Error in subscriber:`, error);
      }
    });

    // Log to console for debugging (remove in production)
    if (process.env.NODE_ENV === "development") {
      console.log(`[EventBus] ${event.type}:`, event.data);
    }
  }

  /**
   * Subscribe to all events
   */
  subscribe(callback: (event: CodingEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get the last event of a specific type
   * Useful for voice agent to get current state snapshot
   */
  getLastEvent(type: CodingEventType): CodingEvent | null {
    return this.eventBuffer.get(type) || null;
  }

  /**
   * Get all buffered events (snapshot of current state)
   */
  getSnapshot(): CodingEvent[] {
    return Array.from(this.eventBuffer.values());
  }

  /**
   * Clear event buffer (useful for session reset)
   */
  clear(): void {
    this.eventBuffer.clear();
  }
}

export const codingEventBus = new CodingEventBus();

