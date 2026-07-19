"use client";

/**
 * Help Button Component
 * 
 * Provides an explicit way for candidates to request help.
 * Emits help_requested event which triggers voice agent to speak.
 */

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CodingEventType } from "@/lib/coding-events";

interface HelpButtonProps {
  onHelpRequested: () => void;
  disabled?: boolean;
}

export function HelpButton({ onHelpRequested, disabled }: HelpButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onHelpRequested}
      disabled={disabled}
      className="gap-2"
    >
      <HelpCircle className="size-3" />
      <span>Need Help?</span>
    </Button>
  );
}

