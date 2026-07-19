"use client";

/**
 * Client-Side Voice Activity Detection Hook
 * 
 * Uses @ricky0123/vad-web (Silero VAD) to detect speech locally in the browser.
 * This gives us FULL CONTROL over silence duration, threshold, etc.
 * 
 * Why we need this:
 * - XAI's server VAD doesn't support custom settings
 * - Server VAD triggers too quickly (~1-1.5s) for interview scenarios
 * - With client VAD, we can wait 2.5-3s of silence before triggering response
 * 
 * Architecture:
 * 1. Audio flows to XAI WebSocket continuously (they need the audio)
 * 2. Our VAD runs locally, detecting speech start/end
 * 3. When VAD says "speech ended", we send response.create to XAI
 * 4. XAI server VAD is DISABLED (turn_detection: null)
 */

import { useRef, useCallback, useState } from "react";

// Type definitions for @ricky0123/vad-web
interface MicVADOptions {
  /** Probability threshold for speech detection (0-1). Default: 0.5 */
  positiveSpeechThreshold?: number;
  /** Probability threshold for non-speech detection. Default: 0.35 */
  negativeSpeechThreshold?: number;
  /** Milliseconds of silence before concluding speech. Default: 1400ms */
  redemptionFrames?: number;
  /** Minimum frames of speech to trigger. Default: 3 */
  minSpeechFrames?: number;
  /** Milliseconds between probability calculations. Default: 96 */
  frameSamples?: number;
  /** Called when speech starts */
  onSpeechStart?: () => void;
  /** Called when speech ends with audio data */
  onSpeechEnd?: (audio: Float32Array) => void;
  /** Called on VAD state changes */
  onVADMisfire?: () => void;
  /** Base path for ONNX WASM files */
  onnxWASMBasePath?: string;
  /** Base path for VAD model assets */
  baseAssetPath?: string;
}

interface MicVAD {
  start: () => void;
  pause: () => void;
  destroy: () => void;
}

interface MicVADStatic {
  new: (options: MicVADOptions) => Promise<MicVAD>;
}

// Interview-tuned VAD settings
const INTERVIEW_VAD_CONFIG = {
  /** 
   * Silence duration before concluding speech (frames)
   * Each frame is ~96ms, so:
   * - Default: 15 frames = ~1440ms (too short for interviews)
   * - Interview: 26 frames = ~2500ms (allows thinking pauses)
   */
  redemptionFrames: 26, // ~2.5 seconds of silence

  /** 
   * Speech detection threshold (0-1)
   * Higher = less sensitive to background noise
   * Default: 0.5, Interview: 0.6
   */
  positiveSpeechThreshold: 0.6,

  /** 
   * Non-speech threshold for ending detection
   * Default: 0.35
   */
  negativeSpeechThreshold: 0.35,

  /** 
   * Minimum speech frames before triggering
   * Prevents accidental triggers from coughs/noise
   * Default: 3
   */
  minSpeechFrames: 4,
};

interface UseClientVADOptions {
  /** Called when user starts speaking */
  onSpeechStart?: () => void;
  /** Called when user stops speaking (after silence duration) */
  onSpeechEnd?: (audio: Float32Array) => void;
  /** Milliseconds of silence before concluding speech */
  silenceDurationMs?: number;
  /** Whether VAD is enabled */
  enabled?: boolean;
}

interface UseClientVADReturn {
  /** Whether VAD is initialized and listening */
  isListening: boolean;
  /** Whether user is currently speaking */
  isSpeaking: boolean;
  /** Start VAD listening */
  start: () => Promise<void>;
  /** Pause VAD listening */
  pause: () => void;
  /** Destroy VAD instance */
  destroy: () => void;
  /** Error if VAD failed to initialize */
  error: string | null;
}

export function useClientVAD({
  onSpeechStart,
  onSpeechEnd,
  silenceDurationMs = 2500,
  enabled = true,
}: UseClientVADOptions = {}): UseClientVADReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const vadRef = useRef<MicVAD | null>(null);
  const MicVADRef = useRef<MicVADStatic | null>(null);

  /**
   * Dynamically load @ricky0123/vad-web
   * Using dynamic import because it requires browser APIs
   */
  const loadVAD = useCallback(async (): Promise<MicVADStatic> => {
    if (MicVADRef.current) {
      return MicVADRef.current;
    }

    try {
      // Dynamic import for client-side only
      const vadModule = await import("@ricky0123/vad-web");
      MicVADRef.current = vadModule.MicVAD;
      return vadModule.MicVAD;
    } catch (err) {
      console.error("[Client VAD] Failed to load VAD module:", err);
      throw new Error("Failed to load VAD module. Make sure @ricky0123/vad-web is installed.");
    }
  }, []);

  /**
   * Start VAD listening
   */
  const start = useCallback(async () => {
    if (!enabled) {
      console.log("[Client VAD] VAD disabled, skipping start");
      return;
    }

    if (vadRef.current) {
      console.log("[Client VAD] Already listening");
      return;
    }

    try {
      setError(null);
      console.log("[Client VAD] Loading VAD module...");
      
      const MicVAD = await loadVAD();

      // Convert silenceDurationMs to frames (~96ms per frame)
      const redemptionFrames = Math.round(silenceDurationMs / 96);
      
      console.log(`[Client VAD] Initializing with ${silenceDurationMs}ms silence (${redemptionFrames} frames)`);

      const vad = await MicVAD.new({
        ...INTERVIEW_VAD_CONFIG,
        redemptionFrames,

        onSpeechStart: () => {
          console.log("[Client VAD] Speech started");
          setIsSpeaking(true);
          onSpeechStart?.();
        },

        onSpeechEnd: (audio: Float32Array) => {
          console.log(`[Client VAD] Speech ended (${audio.length} samples)`);
          setIsSpeaking(false);
          onSpeechEnd?.(audio);
        },

        onVADMisfire: () => {
          console.log("[Client VAD] VAD misfire (speech too short)");
          setIsSpeaking(false);
        },
      });

      vadRef.current = vad;
      vad.start();
      setIsListening(true);
      
      console.log("[Client VAD] Started listening");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[Client VAD] Failed to start:", errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [enabled, silenceDurationMs, onSpeechStart, onSpeechEnd, loadVAD]);

  /**
   * Pause VAD listening (keeps instance)
   */
  const pause = useCallback(() => {
    if (vadRef.current) {
      vadRef.current.pause();
      setIsListening(false);
      setIsSpeaking(false);
      console.log("[Client VAD] Paused");
    }
  }, []);

  /**
   * Destroy VAD instance completely
   */
  const destroy = useCallback(() => {
    if (vadRef.current) {
      vadRef.current.destroy();
      vadRef.current = null;
      setIsListening(false);
      setIsSpeaking(false);
      console.log("[Client VAD] Destroyed");
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    start,
    pause,
    destroy,
    error,
  };
}

/**
 * Pre-configured VAD hooks for different interview types
 */

export function useHRInterviewVAD(options: Omit<UseClientVADOptions, "silenceDurationMs"> = {}) {
  // HR interviews: 2 seconds - conversational, shorter pauses
  return useClientVAD({ ...options, silenceDurationMs: 2000 });
}

export function useTechnicalInterviewVAD(options: Omit<UseClientVADOptions, "silenceDurationMs"> = {}) {
  // Technical interviews: 2.5 seconds - need to think about answers
  return useClientVAD({ ...options, silenceDurationMs: 2500 });
}

export function useCodingInterviewVAD(options: Omit<UseClientVADOptions, "silenceDurationMs"> = {}) {
  // Coding interviews: 3 seconds - lots of thinking while coding
  return useClientVAD({ ...options, silenceDurationMs: 3000 });
}
