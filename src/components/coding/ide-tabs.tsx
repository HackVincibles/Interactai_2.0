"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Code, Lightbulb, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProblemDescription {
  title: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  description: string;
  examples?: { input: string; output: string; explanation?: string }[];
  constraints?: string[];
}

interface IdeTabsProps {
  problem: ProblemDescription;
  hints?: string[];
}

export function IdeTabs({ problem, hints = [] }: IdeTabsProps) {
  const difficultyColors = {
    Easy: "bg-green-500/10 text-green-500 border-green-500/30",
    Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    Hard: "bg-red-500/10 text-red-500 border-red-500/30",
  };

  return (
    <div className="flex h-full flex-col border-r border-[--color-border] bg-[--grok-gray-900]">
      <Tabs defaultValue="description" className="flex h-full flex-col">
        {/* Fixed Tab Headers */}
        <TabsList className="flex-shrink-0 grid w-full grid-cols-3 rounded-none border-b border-[--color-border] bg-[--grok-gray-800] p-0 h-auto">
          <TabsTrigger
            value="description"
            className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-[--grok-accent] data-[state=active]:bg-transparent data-[state=active]:text-[--grok-accent]"
          >
            <FileText className="size-4" />
            <span className="text-xs">Description</span>
          </TabsTrigger>
          <TabsTrigger
            value="code"
            className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-[--grok-accent] data-[state=active]:bg-transparent data-[state=active]:text-[--grok-accent]"
          >
            <Code className="size-4" />
            <span className="text-xs">Code</span>
          </TabsTrigger>
          {hints.length > 0 && (
            <TabsTrigger
              value="hints"
              className="flex items-center justify-center gap-2 rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-[--grok-accent] data-[state=active]:bg-transparent data-[state=active]:text-[--grok-accent]"
            >
              <Lightbulb className="size-4" />
              <span className="text-xs">Hints</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="description" className="m-0 p-4 space-y-4 min-h-0">
            {/* Title & Difficulty */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[--grok-white]">{problem.title}</h2>
                {problem.difficulty && (
                  <Badge
                    variant="outline"
                    className={`mt-1 ${difficultyColors[problem.difficulty]}`}
                  >
                    {problem.difficulty}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm leading-relaxed text-[--grok-gray-200] whitespace-pre-wrap">
                {problem.description}
              </p>
            </div>

            {/* Examples */}
            {problem.examples && problem.examples.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[--grok-white]">Examples</h3>
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="rounded-lg bg-[--grok-gray-800] p-3 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Example {idx + 1}:</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-[--grok-gray-200]">
                          <span className="font-semibold">Input: </span>
                          <code className="rounded bg-[--grok-gray-900] px-1.5 py-0.5 text-[--grok-white]">
                            {ex.input}
                          </code>
                        </p>
                        <p className="text-[--grok-gray-200]">
                          <span className="font-semibold">Output: </span>
                          <code className="rounded bg-[--grok-gray-900] px-1.5 py-0.5 text-[--grok-accent]">
                            {ex.output}
                          </code>
                        </p>
                        {ex.explanation && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <span className="font-semibold">Explanation: </span>
                            {ex.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {problem.constraints && problem.constraints.length > 0 && (
              <div className="space-y-2 pb-4">
                <h3 className="text-sm font-semibold text-[--grok-white]">Constraints</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-[--grok-gray-300]">
                  {problem.constraints.map((constraint, idx) => (
                    <li key={idx}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="code" className="m-0 p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[--grok-white]">Code Template</h3>
              <p className="text-xs text-muted-foreground">
                Use the code editor on the right to write your solution. The function signature is provided below.
              </p>
              <div className="rounded-lg bg-[--grok-gray-800] p-3">
                <pre className="text-xs text-[--grok-gray-200] overflow-x-auto">
                  <code>
                    {`function ${problem.title.toLowerCase().replace(/\s+/g, '')}(...) {
  // Your code here
}`}
                  </code>
                </pre>
              </div>
            </div>
          </TabsContent>

          {hints.length > 0 && (
            <TabsContent value="hints" className="m-0 p-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[--grok-white] flex items-center gap-2">
                  <Lightbulb className="size-4 text-[--grok-accent]" />
                  Hints
                </h3>
                <ul className="space-y-3 pb-4">
                  {hints.map((hint, idx) => (
                    <li key={idx} className="flex items-start gap-2 rounded-lg bg-[--grok-gray-800] p-3 border border-[--grok-accent]/20">
                      <CheckCircle2 className="size-4 text-[--grok-accent] mt-0.5 flex-none" />
                      <p className="text-sm text-[--grok-gray-200]">{hint}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
