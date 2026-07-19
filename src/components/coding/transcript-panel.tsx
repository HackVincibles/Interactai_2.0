"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, ChevronUp, ChevronDown, Bot, User, Copy, Check } from "lucide-react";
import type { TranscriptEntry } from "@/lib/types";

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

export function TranscriptPanel({ transcript, isOpen, onToggle }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, isOpen]);

  const copyTranscript = async () => {
    const text = transcript
      .map((entry) => {
        const role = entry.role === "assistant" ? "Interviewer" : "Candidate";
        const time = new Date(entry.timestamp).toLocaleTimeString();
        return `[${time}] ${role}: ${entry.content}`;
      })
      .join("\n\n");
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col transition-all duration-300"
      style={{
        width: isOpen ? "400px" : "auto",
        height: isOpen ? "500px" : "auto",
      }}
    >
      {isOpen ? (
        // Expanded state - glassmorphic panel
        <div
          className="flex flex-col h-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-[--grok-accent]" />
              <span className="text-sm font-medium text-[--grok-white]">Transcript</span>
              {transcript.length > 0 && (
                <span className="text-xs text-[--grok-gray-400]">({transcript.length})</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {transcript.length > 0 && (
                <button
                  onClick={copyTranscript}
                  className="rounded p-1.5 hover:bg-white/10 text-[--grok-gray-400] hover:text-[--grok-white] transition-colors"
                  title="Copy all"
                >
                  {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
                </button>
              )}
              <button
                onClick={onToggle}
                className="rounded p-1.5 hover:bg-white/10 text-[--grok-gray-400] hover:text-[--grok-white] transition-colors"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          </div>

          {/* Content - native scroll */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ minHeight: 0 }}
          >
            <div className="p-4 space-y-4">
              {transcript.length === 0 ? (
                <p className="text-sm text-[--grok-gray-400] py-4 text-center">
                  Transcript will appear here once voice is enabled...
                </p>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      {entry.role === "assistant" ? (
                        <Bot className="size-3.5 text-blue-400" />
                      ) : (
                        <User className="size-3.5 text-green-400" />
                      )}
                      <span className="text-xs font-medium capitalize text-[--grok-gray-300]">
                        {entry.role === "assistant" ? "Interviewer" : "You"}
                      </span>
                      <span className="text-xs text-[--grok-gray-500]">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-[--grok-gray-200] pl-5 leading-relaxed">
                      {entry.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // Collapsed state - just a button
        <button
          onClick={onToggle}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 shadow-lg hover:bg-white/10 transition-all"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <MessageSquare className="size-4 text-[--grok-accent]" />
          <span className="text-sm font-medium text-[--grok-white]">Transcript</span>
          {transcript.length > 0 && (
            <span className="ml-1 rounded-full bg-[--grok-accent] px-2 py-0.5 text-xs font-semibold text-black">
              {transcript.length}
            </span>
          )}
          <ChevronUp className="size-4 text-[--grok-gray-400]" />
        </button>
      )}
    </div>
  );
}
