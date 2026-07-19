"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";

interface MediaPanelProps {
  title?: string;
}

export function MediaPanel({ title = "Live Interview" }: MediaPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("connected");
      } catch (err) {
        console.error("Media error", err);
        setStatus("error");
      }
    };
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleCamera = () => {
    const next = !cameraOn;
    setCameraOn(next);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
  };

  const statusColor =
    status === "connected" ? "text-[--grok-success]" : status === "error" ? "text-[--grok-error]" : "text-[--grok-accent]";

  return (
    <div className="relative overflow-hidden rounded-xl border border-[--color-border] bg-[--grok-gray-900]">
      <div className="flex items-center justify-between border-b border-[--color-border] px-4 py-3">
        <p className="text-sm text-[--grok-white]">{title}</p>
        <span className={`text-xs capitalize ${statusColor}`}>{status}</span>
      </div>
      <div className="relative aspect-video bg-[--grok-gray-800]">
        <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover bg-[--grok-gray-800]" />
        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-[--grok-white]">
            Camera off
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-[--color-border] px-4 py-3">
        <button
          onClick={toggleCamera}
          className="flex items-center gap-2 rounded-md border border-[--color-border] bg-[--grok-gray-800] px-3 py-2 text-sm hover:border-[--grok-accent]"
        >
          {cameraOn ? <Camera size={16} /> : <CameraOff size={16} />}
          {cameraOn ? "Camera on" : "Camera off"}
        </button>
        <button
          onClick={toggleMic}
          className="flex items-center gap-2 rounded-md border border-[--color-border] bg-[--grok-gray-800] px-3 py-2 text-sm hover:border-[--grok-accent]"
        >
          {micOn ? <Mic size={16} /> : <MicOff size={16} />}
          {micOn ? "Mic on" : "Mic off"}
        </button>
      </div>
    </div>
  );
}

