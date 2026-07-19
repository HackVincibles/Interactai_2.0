"use client";

/**
 * Audio capture and playback hook for interview voice sessions
 * Handles microphone input and speaker output
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { float32ToPCM16Base64, base64PCM16ToFloat32 } from "@/lib/audio-utils";

const CHUNK_DURATION_MS = 100;

interface UseInterviewAudioReturn {
  isCapturing: boolean;
  startCapture: (onAudioData: (base64Audio: string) => void) => Promise<number>;
  stopCapture: () => void;
  stopPlayback: () => void;
  playAudio: (base64Audio: string) => void;
  audioLevel: number;
  sampleRate: number;
}

export function useInterviewAudio(): UseInterviewAudioReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sampleRate, setSampleRate] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const currentPlaybackSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize audio context with native sample rate
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      const nativeSampleRate = audioContextRef.current.sampleRate;
      setSampleRate(nativeSampleRate);
      console.log(`[Interview Audio] Context initialized at ${nativeSampleRate}Hz`);
    }
    return audioContextRef.current;
  }, []);

  // Start audio capture - returns the detected sample rate
  const startCapture = useCallback(async (onAudioData: (base64Audio: string) => void): Promise<number> => {
    try {
      const audioContext = getAudioContext();
      const nativeSampleRate = audioContext.sampleRate;
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: nativeSampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      let audioBuffer: Float32Array[] = [];
      let totalSamples = 0;
      const chunkSizeSamples = (audioContext.sampleRate * CHUNK_DURATION_MS) / 1000;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Calculate audio level for visualization
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setAudioLevel(rms);

        // Buffer audio data
        audioBuffer.push(new Float32Array(inputData));
        totalSamples += inputData.length;

        // Send chunks of ~100ms
        while (totalSamples >= chunkSizeSamples) {
          const chunk = new Float32Array(chunkSizeSamples);
          let offset = 0;

          while (offset < chunkSizeSamples && audioBuffer.length > 0) {
            const buffer = audioBuffer[0];
            const needed = chunkSizeSamples - offset;
            const available = buffer.length;

            if (available <= needed) {
              chunk.set(buffer, offset);
              offset += available;
              totalSamples -= available;
              audioBuffer.shift();
            } else {
              chunk.set(buffer.subarray(0, needed), offset);
              audioBuffer[0] = buffer.subarray(needed);
              offset += needed;
              totalSamples -= needed;
            }
          }

          const base64Audio = float32ToPCM16Base64(chunk);
          onAudioData(base64Audio);
        }
      };

      processorNodeRef.current = processor;
      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsCapturing(true);
      console.log(`[Interview Audio] Capture started at ${nativeSampleRate}Hz`);
      
      return nativeSampleRate;
    } catch (error) {
      console.error("[Interview Audio] Failed to start capture:", error);
      throw error;
    }
  }, [getAudioContext]);

  // Stop audio capture
  const stopCapture = useCallback(() => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsCapturing(false);
    setAudioLevel(0);
    console.log("[Interview Audio] Capture stopped");
  }, []);

  // Stop audio playback (for interruptions)
  const stopPlayback = useCallback(() => {
    if (currentPlaybackSourceRef.current) {
      try {
        currentPlaybackSourceRef.current.stop();
        currentPlaybackSourceRef.current.disconnect();
      } catch {
        // Source may already be stopped
      }
      currentPlaybackSourceRef.current = null;
    }
    
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  // Play audio chunk
  const playAudio = useCallback((base64Audio: string) => {
    try {
      const audioContext = getAudioContext();
      const float32Data = base64PCM16ToFloat32(base64Audio);
      
      playbackQueueRef.current.push(float32Data);

      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        playNextChunk(audioContext);
      }
    } catch (error) {
      console.error("[Interview Audio] Error playing audio:", error);
    }
  }, [getAudioContext]);

  // Play next chunk from queue
  const playNextChunk = useCallback((audioContext: AudioContext) => {
    if (playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      currentPlaybackSourceRef.current = null;
      return;
    }

    const chunk = playbackQueueRef.current.shift()!;
    const audioBuffer = audioContext.createBuffer(1, chunk.length, audioContext.sampleRate);
    audioBuffer.getChannelData(0).set(chunk);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    currentPlaybackSourceRef.current = source;

    source.onended = () => {
      if (currentPlaybackSourceRef.current === source) {
        currentPlaybackSourceRef.current = null;
      }
      playNextChunk(audioContext);
    };

    source.start();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopCapture, stopPlayback]);

  return {
    isCapturing,
    startCapture,
    stopCapture,
    stopPlayback,
    playAudio,
    audioLevel,
    sampleRate,
  };
}
