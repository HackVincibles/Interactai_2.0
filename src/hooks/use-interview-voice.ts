"use client";

/**
 * Interview Voice Hook
 * Manages WebSocket connection to XAI realtime API for voice interviews
 * Configured for natural, human-like conversation
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { TranscriptEntry } from "@/lib/types";

const XAI_REALTIME_URL = "wss://api.x.ai/v1/realtime";

// Message types from XAI API
interface XAIMessage {
  type: string;
  [key: string]: unknown;
}

interface SessionConfig {
  temperature: number;
  // Note: turnDetection is now handled server-side with XAI defaults
}

interface SessionResponse {
  client_secret: {
    value: string;
    expires_at: number;
  };
  voice: string;
  instructions: string;
  sessionConfig?: SessionConfig;
  error?: string;
}

interface UseInterviewVoiceProps {
  onTranscriptUpdate: (entry: TranscriptEntry) => void;
  onStatusChange?: (status: "connecting" | "connected" | "disconnected" | "error") => void;
  onSessionEnd?: () => void; // Called when agent says closing phrase and session should end
}

// Full context to send to session API when server-side stores might be empty
interface InterviewContext {
  candidateId?: string;
  candidateData?: {
    id: string;
    name: string;
    email: string;
    jobId: string;
    resumeSummary?: string;
  };
  jobData?: {
    id: string;
    title: string;
    company: string;
    requirements: string[];
    interviewConfig: {
      hrDuration: number;
      technicalDuration: number;
      codingDuration: number;
    };
  };
}

interface UseInterviewVoiceReturn {
  isConnected: boolean;
  status: "idle" | "connecting" | "connected" | "disconnected" | "error";
  connect: (roundType: string, sessionId: string, sampleRate: number, context?: InterviewContext) => Promise<void>;
  disconnect: () => void;
  sendAudio: (base64Audio: string) => void;
  sendContext: (context: string, options?: { triggerResponse?: boolean }) => void;
  /** Trigger AI response - called by client VAD when user stops speaking */
  triggerResponse: () => void;
  error: string | null;
}

// Response debounce delay (ms) - wait before playing AI response
// This gives users time to continue speaking without interruption
const RESPONSE_DEBOUNCE_MS = 1500; // 1.5 seconds

export function useInterviewVoice({
  onTranscriptUpdate,
  onStatusChange,
  onSessionEnd,
}: UseInterviewVoiceProps): UseInterviewVoiceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "disconnected" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const sessionConfigRef = useRef<{ 
    voice: string; 
    instructions: string; 
    sampleRate: number;
    temperature?: number;
  } | null>(null);
  const isSessionConfigured = useRef(false);
  const currentTranscriptRef = useRef<{ role: "assistant" | "candidate"; content: string } | null>(null);
  
  // Response debouncing - prevents AI from interrupting user mid-thought
  const audioBufferRef = useRef<string[]>([]); // Buffer incoming audio chunks
  const transcriptBufferRef = useRef<string>(""); // Buffer incoming transcript
  const audioTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce timeout
  const userSpeakingRef = useRef(false); // Is user currently speaking?
  const isPlayingResponseRef = useRef(false); // Is AI response currently playing?
  const isBufferingResponseRef = useRef(false); // Are we currently buffering a response?

  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus === "idle" ? "disconnected" : newStatus);
  }, [onStatusChange]);

  /**
   * Safely send a message to WebSocket (only if OPEN)
   */
  const safeSend = useCallback((ws: WebSocket, data: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
    console.warn("[Interview Voice] WebSocket not ready, skipping send");
    return false;
  }, []);


  /**
   * Flush buffered response - play audio AND show transcript together
   */
  const flushResponseBuffer = useCallback(() => {
    // Flush transcript first (so it appears as audio plays)
    if (transcriptBufferRef.current) {
      const transcriptContent = transcriptBufferRef.current;
      
      onTranscriptUpdate({
        timestamp: new Date().toISOString(),
        role: "assistant",
        content: transcriptContent,
      });
      currentTranscriptRef.current = {
        role: "assistant",
        content: transcriptContent,
      };
      transcriptBufferRef.current = "";
    }
    
    // Then play all buffered audio
    if (audioBufferRef.current.length > 0) {
      console.log(`[Interview Voice] Playing ${audioBufferRef.current.length} buffered audio chunks after debounce`);
      isPlayingResponseRef.current = true;
      
      for (const chunk of audioBufferRef.current) {
        window.dispatchEvent(new CustomEvent("interview-audio", { detail: chunk }));
      }
      
      audioBufferRef.current = [];
    }
    
    isBufferingResponseRef.current = false;
  }, [onTranscriptUpdate]);

  /**
   * Cancel pending AI response (called when user starts speaking)
   */
  const cancelPendingResponse = useCallback(() => {
    // Clear debounce timeout
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
      audioTimeoutRef.current = null;
    }
    
    // Clear buffered audio and transcript
    if (audioBufferRef.current.length > 0 || transcriptBufferRef.current) {
      console.log(`[Interview Voice] Cancelled buffered response - user speaking`);
      audioBufferRef.current = [];
      transcriptBufferRef.current = "";
    }
    
    isPlayingResponseRef.current = false;
    isBufferingResponseRef.current = false;
  }, []);

  /**
   * Configure the XAI session after connection
   * Includes all parameters for natural, agentic conversation
   */
  const configureSession = useCallback((ws: WebSocket) => {
    if (!sessionConfigRef.current) return;
    if (ws.readyState !== WebSocket.OPEN) {
      console.warn("[Interview Voice] WebSocket not open, cannot configure session");
      return;
    }

    const { voice, instructions, sampleRate, temperature } = sessionConfigRef.current;

    console.log(`[Interview Voice] Configuring session:`);
    console.log(`  - Sample rate: ${sampleRate}Hz`);
    console.log(`  - Voice: ${voice}`);
    console.log(`  - Temperature: ${temperature || 0.8}`);
    console.log(`  - Turn detection: server_vad (using server defaults for natural pauses)`);

    const sessionConfig = {
      type: "session.update",
      session: {
        // System instructions for the interviewer persona
        instructions,
        
        // Voice selection
        voice,
        
        // Enable both text and audio modalities
        modalities: ["text", "audio"],
        
        // Temperature for varied, natural responses
        temperature: temperature || 0.8,
        
        // Limit response length to keep it conversational
        max_response_output_tokens: 150,
        
        // Audio format configuration
        audio: {
          input: {
            format: {
              type: "audio/pcm",
              rate: sampleRate,
            },
          },
          output: {
            format: {
              type: "audio/pcm",
              rate: sampleRate,
            },
          },
        },
        
        // Input audio transcription for better speech understanding
        input_audio_transcription: {
          model: "whisper-1",
        },
        
        // Turn detection - using server VAD
        // NOTE: XAI doesn't support custom VAD params (silence_duration_ms, threshold)
        // We tried client-side VAD but it has SSR issues with Next.js + ONNX
        // For now, we rely on strict prompts to prevent filler sounds ("Mm-hmm")
        turn_detection: {
          type: "server_vad",
        },
      },
    };

    safeSend(ws, sessionConfig);
  }, [safeSend]);

  /**
   * Send initial greeting to start the interview
   * The AI will introduce itself based on its persona in the system prompt
   */
  const sendInitialGreeting = useCallback((ws: WebSocket) => {
    if (ws.readyState !== WebSocket.OPEN) {
      console.warn("[Interview Voice] WebSocket not open, cannot send greeting");
      return;
    }

    console.log("[Interview Voice] Session configured, starting interview...");

    // Commit any pending audio buffer
    safeSend(ws, { type: "input_audio_buffer.commit" });

    // Simple trigger - the AI's persona will determine how it introduces itself
    const greetingMessage = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Start the interview naturally by greeting the candidate.",
          },
        ],
      },
    };
    safeSend(ws, greetingMessage);

    // Request response
    safeSend(ws, { type: "response.create" });

    console.log("[Interview Voice] Ready for voice interaction");
  }, [safeSend]);

  /**
   * Handle incoming messages from XAI
   */
  const handleMessage = useCallback((message: XAIMessage) => {
    // Handle conversation created - configure session
    if (message.type === "conversation.created" && !isSessionConfigured.current) {
      console.log("[Interview Voice] Conversation created, configuring...");
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        configureSession(wsRef.current);
      }
    }

    // Handle session updated - send initial greeting
    if (message.type === "session.updated" && !isSessionConfigured.current) {
      isSessionConfigured.current = true;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendInitialGreeting(wsRef.current);
      }
    }

    // Handle assistant transcript (interviewer speaking) - BUFFER for debounce
    if (message.type === "response.output_audio_transcript.delta" && "delta" in message) {
      const delta = message.delta as string;

      // If user is speaking, discard
      if (userSpeakingRef.current) {
        return;
      }
      
      // Buffer the transcript (will be shown when audio plays)
      transcriptBufferRef.current += delta;
    }

    // Handle response done - agent finished speaking
    if (message.type === "response.done") {
      currentTranscriptRef.current = null;
      // Agent is smart enough to conclude naturally per its instructions
      // No detection needed - if it says goodbye and stops, conversation ends naturally
    }

    // Handle user speech started - CANCEL any pending AI response
    if (message.type === "input_audio_buffer.speech_started") {
      userSpeakingRef.current = true;
      cancelPendingResponse(); // Cancel buffered audio - user is speaking again
      
      currentTranscriptRef.current = {
        role: "candidate",
        content: "",
      };
    }

    // Handle user speech committed - user finished speaking
    if (message.type === "input_audio_buffer.committed") {
      userSpeakingRef.current = false;
      currentTranscriptRef.current = null;
    }

    // Handle conversation item added (contains user transcript)
    if (message.type === "conversation.item.added" && "item" in message) {
      const item = message.item as { role?: string; content?: Array<{ type: string; transcript?: string }> };
      if (item.role === "user" && item.content) {
        for (const content of item.content) {
          if (content.type === "input_audio" && content.transcript) {
            onTranscriptUpdate({
              timestamp: new Date().toISOString(),
              role: "candidate",
              content: content.transcript,
            });
            break;
          }
        }
      }
    }
  }, [configureSession, sendInitialGreeting, onTranscriptUpdate, cancelPendingResponse]);

  /**
   * Connect to XAI for interview session
   */
  const connect = useCallback(async (roundType: string, sessionId: string, sampleRate: number, context?: InterviewContext) => {
    try {
      setError(null);
      updateStatus("connecting");
      
      console.log(`[Interview Voice] Getting session token for ${roundType} round...`);

      // Get ephemeral token from our API, sending full context to handle server restarts
      const response = await fetch("/api/interview/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          roundType, 
          sessionId, 
          candidateId: context?.candidateId,
          candidateData: context?.candidateData,
          jobData: context?.jobData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to get session: ${response.statusText}`);
      }

      const data: SessionResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const ephemeralToken = data.client_secret.value;
      console.log(`[Interview Voice] Token received`);
      console.log(`[Interview Voice] Voice: ${data.voice}`);
      console.log(`[Interview Voice] Temperature: ${data.sessionConfig?.temperature || 0.8}`);

      // Store session config (turn detection now uses XAI server defaults)
      sessionConfigRef.current = {
        voice: data.voice,
        instructions: data.instructions,
        sampleRate,
        temperature: data.sessionConfig?.temperature,
      };
      isSessionConfigured.current = false;

      // Connect to XAI API
      console.log(`[Interview Voice] Connecting to XAI API...`);
      const ws = new WebSocket(XAI_REALTIME_URL, [
        "realtime",
        `openai-insecure-api-key.${ephemeralToken}`,
        "openai-beta.realtime-v1",
      ]);

      ws.onopen = () => {
        console.log("[Interview Voice] Connected to XAI API");
        setIsConnected(true);
        updateStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const message: XAIMessage = JSON.parse(event.data);
          
          // Forward audio to playback WITH DEBOUNCING
          // This prevents AI from interrupting users mid-thought
          if (message.type === "response.output_audio.delta") {
            // If user is speaking, discard AI audio
            if (userSpeakingRef.current) {
              return; // Don't buffer or play while user is speaking
            }
            
            // Buffer the audio chunk
            audioBufferRef.current.push(message.delta as string);
            
            // Start debounce timer on FIRST chunk only
            // This gives user RESPONSE_DEBOUNCE_MS to continue speaking
            if (!isBufferingResponseRef.current) {
              isBufferingResponseRef.current = true;
              console.log(`[Interview Voice] Buffering response, will play in ${RESPONSE_DEBOUNCE_MS}ms if user doesn't speak`);
              
              audioTimeoutRef.current = setTimeout(() => {
                if (!userSpeakingRef.current) {
                  flushResponseBuffer();
                }
                audioTimeoutRef.current = null;
              }, RESPONSE_DEBOUNCE_MS);
            }
          }
          
          handleMessage(message);
        } catch (err) {
          console.error("[Interview Voice] Error parsing message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("[Interview Voice] WebSocket error:", err);
        setError("Connection error");
        updateStatus("error");
      };

      ws.onclose = (event) => {
        console.log(`[Interview Voice] Disconnected - Code: ${event.code}`);
        setIsConnected(false);
        updateStatus("disconnected");
        wsRef.current = null;
        isSessionConfigured.current = false;
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[Interview Voice] Connection failed:", err);
      setError(err instanceof Error ? err.message : "Connection failed");
      updateStatus("error");
      throw err;
    }
  }, [handleMessage, updateStatus]);

  /**
   * Disconnect from the session
   */
  const disconnect = useCallback(() => {
    // Clear all timeouts and buffers
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current);
      audioTimeoutRef.current = null;
    }
    audioBufferRef.current = [];
    transcriptBufferRef.current = "";
    userSpeakingRef.current = false;
    isPlayingResponseRef.current = false;
    isBufferingResponseRef.current = false;
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    updateStatus("idle");
    isSessionConfigured.current = false;
    currentTranscriptRef.current = null;
  }, [updateStatus]);

  /**
   * Send audio data to XAI
   */
  const sendAudio = useCallback((base64Audio: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Don't send audio until session is configured
      if (!isSessionConfigured.current) return;

      wsRef.current.send(JSON.stringify({
        type: "input_audio_buffer.append",
        audio: base64Audio,
      }));
    }
  }, []);

  /**
   * Trigger AI response - called by client-side VAD when speech ends
   * 
   * Since server VAD is disabled (turn_detection: null), we need to manually
   * tell XAI when the user has finished speaking. This is called by the
   * client-side VAD (@ricky0123/vad-web) after detecting silence.
   */
  const triggerResponse = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[Interview Voice] Cannot trigger response - not connected");
      return;
    }
    if (!isSessionConfigured.current) {
      console.warn("[Interview Voice] Cannot trigger response - session not configured");
      return;
    }

    console.log("[Interview Voice] Client VAD triggered response");

    // Commit the audio buffer (tells XAI "user finished speaking")
    safeSend(wsRef.current, { type: "input_audio_buffer.commit" });

    // Request AI response
    safeSend(wsRef.current, { type: "response.create" });
  }, [safeSend]);

  /**
   * Send context to the voice agent (for IDE events, code analysis, etc.)
   * This injects context into the conversation without the user speaking
   * The voice agent can then decide whether to respond based on the context
   */
  const sendContext = useCallback((context: string, options?: { triggerResponse?: boolean }) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[Interview Voice] Cannot send context - not connected");
      return;
    }
    if (!isSessionConfigured.current) {
      console.warn("[Interview Voice] Cannot send context - session not configured");
      return;
    }

    // Send context as a system-level input (not user speech)
    const contextMessage = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: `[SYSTEM CONTEXT - DO NOT READ ALOUD, use this to inform your next response if appropriate]\n${context}`,
          },
        ],
      },
    };
    
    safeSend(wsRef.current, contextMessage);

    // Optionally trigger a response (e.g., for help_requested or time_checkpoint)
    if (options?.triggerResponse) {
      safeSend(wsRef.current, { type: "response.create" });
    }

    console.log("[Interview Voice] Context sent:", context.substring(0, 100) + "...");
  }, [safeSend]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    status,
    connect,
    disconnect,
    sendAudio,
    sendContext,
    triggerResponse,
    error,
  };
}
