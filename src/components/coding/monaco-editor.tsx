"use client";

import { useRef } from "react";
import Editor, { OnChange } from "@monaco-editor/react";
import type { CodeDeltaData } from "@/lib/coding-events";

interface MonacoEditorProps {
  language: string;
  value: string;
  onChange: OnChange;
  height?: string;
  onCodeDelta?: (data: CodeDeltaData) => void;
}

export function MonacoEditor({
  language,
  value,
  onChange,
  height = "100%",
  onCodeDelta,
}: MonacoEditorProps) {
  const previousValueRef = useRef<string>(value);
  const previousLineCountRef = useRef<number>(value.split("\n").length);

  const handleChange: OnChange = (newValue, ev) => {
    // Call original onChange
    onChange(newValue, ev);

    // Track code delta for event emission
    if (onCodeDelta && newValue !== undefined) {
      const previousValue = previousValueRef.current;
      const newLines = newValue.split("\n");
      const oldLines = previousValue.split("\n");
      const newLineCount = newLines.length;
      const oldLineCount = oldLines.length;

      // Calculate which lines changed
      let firstChangedLine = -1;
      let lastChangedLine = -1;

      for (let i = 0; i < Math.max(newLineCount, oldLineCount); i++) {
        if (newLines[i] !== oldLines[i]) {
          if (firstChangedLine === -1) firstChangedLine = i + 1;
          lastChangedLine = i + 1;
        }
      }

      // Determine diff size
      const lineDiff = Math.abs(newLineCount - oldLineCount);
      const charDiff = Math.abs(newValue.length - previousValue.length);
      let diffSize: "small" | "medium" | "large" = "small";
      if (lineDiff > 10 || charDiff > 500) {
        diffSize = "large";
      } else if (lineDiff > 3 || charDiff > 100) {
        diffSize = "medium";
      }

      // Generate summary
      let summary = "code edited";
      if (firstChangedLine !== -1 && lastChangedLine !== -1) {
        if (firstChangedLine === lastChangedLine) {
          summary = `edited line ${firstChangedLine}`;
        } else {
          summary = `edited lines ${firstChangedLine}-${lastChangedLine}`;
        }
      }

      // Emit code delta with full code for voice agent analysis
      onCodeDelta({
        file: language === "python" ? "main.py" : language === "javascript" ? "main.js" : "main.cpp",
        language,
        code: newValue, // Full code - voice agent needs this to give contextual hints
        summary,
        diffSize,
        lineCount: newLineCount,
      });

      // Update refs
      previousValueRef.current = newValue;
      previousLineCountRef.current = newLineCount;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[--grok-gray-900]">
      <Editor
        height={height}
        theme="vs-dark"
        language={language}
        value={value}
        onChange={handleChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          wordWrap: "on",
          lineNumbers: "on",
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          padding: { top: 16, bottom: 16 },
          fontFamily: "var(--font-geist-mono), 'Courier New', monospace",
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
