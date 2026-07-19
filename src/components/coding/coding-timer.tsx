"use client";

/**
 * Coding Timer Component
 * 
 * Displays a countdown timer for the coding round (default 15 minutes)
 * and emits time_checkpoint events at 5min and 2min remaining.
 * 
 * These checkpoints trigger voice agent hints about time remaining.
 */

import { useEffect, useState, useRef } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodingEventType } from "@/lib/coding-events";

interface CodingTimerProps {
  timeLimitMinutes: number;
  onTimeCheckpoint: (minutesLeft: number) => void;
  className?: string;
}

export function CodingTimer({
  timeLimitMinutes,
  onTimeCheckpoint,
  className,
}: CodingTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60); // seconds
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const checkpointEmittedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1);
        const minutesLeft = Math.ceil(newTime / 60);

        // Emit checkpoint at 5 minutes and 2 minutes
        if (minutesLeft === 5 && !checkpointEmittedRef.current.has(5)) {
          checkpointEmittedRef.current.add(5);
          onTimeCheckpoint(5);
        } else if (minutesLeft === 2 && !checkpointEmittedRef.current.has(2)) {
          checkpointEmittedRef.current.add(2);
          onTimeCheckpoint(2);
        }

        // Update warning states
        setIsWarning(minutesLeft <= 5 && minutesLeft > 2);
        setIsCritical(minutesLeft <= 2);

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeCheckpoint]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-mono",
        isCritical
          ? "bg-red-500/10 text-red-500 border border-red-500/30"
          : isWarning
            ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
            : "bg-[--grok-gray-800] text-[--grok-gray-300] border border-[--color-border]",
        className
      )}
    >
      <Clock className={cn("size-4", isCritical && "animate-pulse")} />
      <span>{formattedTime}</span>
    </div>
  );
}

