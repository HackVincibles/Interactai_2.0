"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, Mic, MicOff, X, AlertCircle, Video } from "lucide-react";

interface DraggableCameraProps {
  onClose?: () => void;
}

export function DraggableCamera({ onClose }: DraggableCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // Track if user clicked to start
  const dragStartRef = useRef({ x: 0, y: 0 });

  const initCamera = useCallback(async () => {
    setHasStarted(true);
    setIsConnecting(true);
    setError(null);
    setHasVideo(false);
    
    try {
      // Stop any existing streams first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user"
        },
        audio: true,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setHasVideo(true);
            setIsConnecting(false);
          }).catch((e) => {
            console.error("Play error:", e);
            setIsConnecting(false);
            setError("Failed to play video");
          });
        };
      }
    } catch (err) {
      console.error("Media error", err);
      setIsConnecting(false);
      if (err instanceof Error) {
        if (err.name === "NotReadableError") {
          setError("Camera in use by another app");
        } else if (err.name === "NotAllowedError") {
          setError("Camera access denied");
        } else if (err.name === "NotFoundError") {
          setError("No camera found");
        } else {
          setError("Camera unavailable");
        }
      } else {
        setError("Camera unavailable");
      }
    }
  }, []);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const toggleCamera = () => {
    if (error) return;
    const next = !cameraOn;
    setCameraOn(next);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const toggleMic = () => {
    if (error) return;
    const next = !micOn;
    setMicOn(next);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-50 w-[220px] cursor-move select-none overflow-hidden rounded-lg border border-[--grok-accent]/30 bg-[--grok-gray-900] shadow-2xl shadow-[--grok-accent]/10"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        userSelect: isDragging ? "none" : "auto",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[--color-border] bg-[--grok-gray-800] px-3 py-2">
        <div className="flex items-center gap-2">
          <Video className="size-3 text-[--grok-accent]" />
          <span className="text-xs font-medium text-[--grok-white]">Camera</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-[--grok-gray-700] text-[--grok-gray-400] hover:text-[--grok-white] transition-colors"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Video */}
      <div className="relative aspect-video bg-black">
        {/* Always render video element but control visibility */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover ${hasVideo && !error ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: 'scaleX(-1)' }} /* Mirror the video */
        />
        
        {/* Not started - show start button */}
        {!hasStarted && !isConnecting && !error && (
          <button
            onClick={initCamera}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[--grok-gray-900] p-3 text-center cursor-pointer hover:bg-[--grok-gray-800] transition-colors"
          >
            <Camera className="size-8 text-[--grok-accent] mb-2" />
            <span className="text-xs text-[--grok-white] font-medium">Click to Start</span>
          </button>
        )}
        
        {/* Loading state overlay */}
        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[--grok-gray-900] text-[--grok-accent]">
            <div className="size-6 border-2 border-[--grok-accent]/30 border-t-[--grok-accent] rounded-full animate-spin mb-2" />
            <span className="text-xs">Connecting...</span>
          </div>
        )}
        
        {/* Error state overlay */}
        {error && !isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[--grok-gray-900] p-3 text-center">
            <AlertCircle className="size-6 text-[--grok-accent] mb-2" />
            <span className="text-xs text-[--grok-gray-300] mb-2">{error}</span>
            <button
              onClick={initCamera}
              className="text-xs text-[--grok-accent] hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Camera off overlay */}
        {!cameraOn && hasVideo && !error && !isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-[--grok-gray-400]">
            <CameraOff className="size-8" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 border-t border-[--color-border] bg-[--grok-gray-800] p-2">
        <button
          onClick={toggleCamera}
          disabled={!!error || isConnecting}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors ${
            error || isConnecting
              ? "bg-[--grok-gray-700] text-[--grok-gray-500] cursor-not-allowed"
              : cameraOn
                ? "bg-[--grok-accent]/20 text-[--grok-accent] hover:bg-[--grok-accent]/30"
                : "bg-[--grok-gray-700] text-[--grok-gray-400] hover:bg-[--grok-gray-600]"
          }`}
        >
          {cameraOn ? <Camera className="size-3" /> : <CameraOff className="size-3" />}
        </button>
        <button
          onClick={toggleMic}
          disabled={!!error || isConnecting}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors ${
            error || isConnecting
              ? "bg-[--grok-gray-700] text-[--grok-gray-500] cursor-not-allowed"
              : micOn
                ? "bg-[--grok-accent]/20 text-[--grok-accent] hover:bg-[--grok-accent]/30"
                : "bg-[--grok-gray-700] text-[--grok-gray-400] hover:bg-[--grok-gray-600]"
          }`}
        >
          {micOn ? <Mic className="size-3" /> : <MicOff className="size-3" />}
        </button>
      </div>
    </div>
  );
}
