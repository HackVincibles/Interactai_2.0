"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code2 } from "lucide-react";

const languages = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Code2 className="size-4 text-[--grok-accent]" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] border-[--color-border] bg-[--grok-gray-800] text-[--grok-white] focus:ring-[--grok-accent]/30">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent className="bg-[--grok-gray-800] border-[--color-border]">
          {languages.map((lang) => (
            <SelectItem 
              key={lang.value} 
              value={lang.value}
              className="text-[--grok-white] focus:bg-[--grok-accent]/20 focus:text-[--grok-accent]"
            >
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
