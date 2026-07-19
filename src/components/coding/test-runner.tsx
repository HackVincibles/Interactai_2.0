"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestCase {
  name: string;
  functionName?: string;
  args?: any[];
  status: "pass" | "fail" | "pending" | "running";
  input?: string; // Legacy support - will be replaced by args
  expectedOutput?: string;
  expected?: any; // New structured format
  actualOutput?: string;
  actual?: any; // New structured format
  stdout?: string; // Captured print output
  error?: string;
  executionTime?: number;
}

interface TestRunnerProps {
  tests: TestCase[];
  onRunAll?: () => void;
  onRunTest?: (testIndex: number) => void;
}

export function TestRunner({ tests, onRunAll, onRunTest }: TestRunnerProps) {
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());

  const toggleTest = (index: number) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTests(newExpanded);
  };

  const passedCount = tests.filter((t) => t.status === "pass").length;
  const failedCount = tests.filter((t) => t.status === "fail").length;
  const pendingCount = tests.filter((t) => t.status === "pending").length;

  const getStatusIcon = (status: TestCase["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="size-4 text-green-500" />;
      case "fail":
        return <XCircle className="size-4 text-red-500" />;
      case "running":
        return <Clock className="size-4 text-[--grok-accent] animate-spin" />;
      default:
        return <Clock className="size-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TestCase["status"]) => {
    switch (status) {
      case "pass":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            Passed
          </Badge>
        );
      case "fail":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
            Failed
          </Badge>
        );
      case "running":
        return (
          <Badge variant="outline" className="bg-[--grok-accent]/10 text-[--grok-accent] border-[--grok-accent]/30">
            Running
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="flex h-full flex-col border-t border-[--color-border] bg-[--grok-gray-900]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[--color-border] px-4 py-3">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-[--grok-white]">Test Cases</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className={cn("flex items-center gap-1", passedCount > 0 && "text-green-500")}>
              {passedCount} passed
            </span>
            <span className={cn("flex items-center gap-1", failedCount > 0 && "text-red-500")}>
              {failedCount} failed
            </span>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1">{pendingCount} pending</span>
            )}
          </div>
        </div>
        <Button
          onClick={onRunAll}
          size="sm"
          className="bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black font-semibold"
        >
          <Play className="size-3 mr-1" />
          Run All
        </Button>
      </div>

      {/* Test Cases List */}
      <div className="flex-1 overflow-y-auto">
        {tests.map((test, index) => {
          const isExpanded = expandedTests.has(index);
          return (
            <div
              key={index}
              className={cn(
                "border-b border-[--color-border] transition-colors",
                test.status === "pass" && "bg-green-500/5",
                test.status === "fail" && "bg-red-500/5"
              )}
            >
              {/* Test Header */}
              <button
                onClick={() => toggleTest(index)}
                className="flex w-full items-center justify-between px-4 py-3 hover:bg-[--grok-gray-800]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  {getStatusIcon(test.status)}
                  <span className="text-sm font-medium text-[--grok-white]">{test.name}</span>
                  {test.executionTime !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ({test.executionTime}ms)
                    </span>
                  )}
                </div>
                {getStatusBadge(test.status)}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 bg-[--grok-gray-800]/30">
                  {/* Input - support both old and new format */}
                  {(test.input || (test.args && test.functionName)) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Input:</p>
                      <pre className="rounded bg-[--grok-gray-900] p-2 text-xs text-[--grok-white] overflow-x-auto">
                        {test.input || 
                          (test.functionName && test.args 
                            ? `${test.functionName}(${test.args.map(arg => JSON.stringify(arg)).join(", ")})`
                            : "")}
                      </pre>
                    </div>
                  )}
                  
                  {/* Expected Output - support both formats */}
                  {(test.expectedOutput !== undefined || test.expected !== undefined) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Expected Output:</p>
                      <pre className="rounded bg-[--grok-gray-900] p-2 text-xs text-green-400 overflow-x-auto">
                        {test.expectedOutput || JSON.stringify(test.expected)}
                      </pre>
                    </div>
                  )}
                  
                  {/* Actual Output - support both formats */}
                  {(test.actualOutput !== undefined || test.actual !== undefined) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Your Output:</p>
                      <pre
                        className={cn(
                          "rounded bg-[--grok-gray-900] p-2 text-xs overflow-x-auto",
                          test.status === "pass" ? "text-green-400" : "text-red-400"
                        )}
                      >
                        {test.actualOutput !== undefined 
                          ? test.actualOutput 
                          : JSON.stringify(test.actual)}
                      </pre>
                    </div>
                  )}
                  
                  {/* Stdout - captured print statements */}
                  {test.stdout && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Output (stdout):</p>
                      <pre className="rounded bg-[--grok-gray-900] p-2 text-xs text-blue-400 overflow-x-auto whitespace-pre-wrap">
                        {test.stdout}
                      </pre>
                    </div>
                  )}
                  
                  {/* Error */}
                  {test.error && (
                    <div>
                      <p className="text-xs font-medium text-red-500 mb-1">Error:</p>
                      <pre className="rounded bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400 overflow-x-auto whitespace-pre-wrap">
                        {test.error}
                      </pre>
                    </div>
                  )}
                  
                  {onRunTest && (
                    <Button
                      onClick={() => onRunTest(index)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Play className="size-3 mr-1" />
                      Run This Test
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
