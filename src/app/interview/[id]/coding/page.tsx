"use client";

import { use, useState, useEffect, useMemo, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSelector } from "@/components/coding/language-selector";
import { MonacoEditor } from "@/components/coding/monaco-editor";
import { TestRunner } from "@/components/coding/test-runner";
import { IdeTabs } from "@/components/coding/ide-tabs";
import { DraggableCamera } from "@/components/coding/draggable-camera";
import { ArrowLeft, Play, Send, Loader2, Brain, Mic, MicOff, Square, CheckCircle2, Trophy, Clock, Code2 } from "lucide-react";
import { usePythonRunner } from "@/hooks/use-python-runner";
import type { TestCase as StructuredTestCase } from "@/lib/code-execution-types";
import { getProblemById, CODING_PROBLEMS } from "@/lib/coding-problems";
import { useCodingEvents } from "@/hooks/use-coding-events";
import { useIdleTimer } from "@/hooks/use-idle-timer";
import { useInterviewVoice } from "@/hooks/use-interview-voice";
import { useInterviewAudio } from "@/hooks/use-interview-audio";
import { useCodingVoice } from "@/hooks/use-coding-voice";
// Client VAD disabled - has SSR issues with Next.js + ONNX Runtime
// import { useCodingInterviewVAD } from "@/hooks/use-client-vad";
import { CodingTimer } from "@/components/coding/coding-timer";
import { HelpButton } from "@/components/coding/help-button";
import { TranscriptPanel } from "@/components/coding/transcript-panel";
import type { CodeDeltaData, TestResultData } from "@/lib/coding-events";
import type { TranscriptEntry, Candidate, InterviewSession } from "@/lib/types";


// Helper to get stored candidates from localStorage
const getStoredCandidates = (): Candidate[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("interview-candidates");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to get stored interview mappings from localStorage (interviewId -> candidateId)
const getInterviewMapping = (interviewId: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("interview-mappings");
    const mappings = stored ? JSON.parse(stored) : {};
    return mappings[interviewId] || null;
  } catch {
    return null;
  }
};

type TestCaseStatus = "pass" | "fail" | "pending" | "running";

interface TestCase {
  name: string;
  functionName?: string;
  args?: any[];
  status: TestCaseStatus;
  input?: string; // Legacy support
  expectedOutput?: string; // Legacy support
  expected?: any; // New structured format
  actualOutput?: string; // Legacy support
  actual?: any; // New structured format
  stdout?: string;
  executionTime?: number;
  error?: string;
}

// Helper to convert structured tests to display format
function convertToDisplayTests(structuredTests: StructuredTestCase[]): TestCase[] {
  return structuredTests.map((test) => ({
  name: test.name,
  functionName: test.functionName,
  args: test.args,
  expected: test.expected,
  status: "pending" as TestCaseStatus,
  input: `${test.functionName}(${test.args.map((arg) => JSON.stringify(arg)).join(", ")})`,
  expectedOutput: JSON.stringify(test.expected),
}));
}

// Inner component that uses useSearchParams
function CodingRoundInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const problemId = searchParams.get("problem") || "two-sum";
  
  // Load problem from library
  const currentProblem = useMemo(() => {
    return getProblemById(problemId) || CODING_PROBLEMS[0];
  }, [problemId]);

  const problem = useMemo(() => ({
    title: currentProblem.title,
    difficulty: currentProblem.difficulty,
    description: currentProblem.description,
    examples: currentProblem.examples,
    constraints: currentProblem.constraints,
  }), [currentProblem]);

  const hints = currentProblem.hints;
  
  // State for dynamically loaded data  
  const [candidate, setCandidate] = useState<Candidate | null>(() => {
    // Try to find candidate via interview mapping in localStorage
    const candidateId = getInterviewMapping(id);
    if (candidateId) {
      // Check localStorage
      const storedCandidates = getStoredCandidates();
      const storedCandidate = storedCandidates.find(c => c.id === candidateId);
      if (storedCandidate) return storedCandidate;
    }
    
    // Fallback: Try localStorage for the most recent candidate
    const storedCandidates = getStoredCandidates();
    if (storedCandidates.length > 0) {
      return storedCandidates.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )[0];
    }
    return null;
  });
  const job = null; // Removed mock job dependency
  
  // Initialize tests from the current problem
  const getInitialTests = () => convertToDisplayTests(currentProblem.testCases);

  const [language, setLanguage] = useState("python"); // Default to Python for IDE functionality
  const [code, setCode] = useState(() => currentProblem.starterCode.python);
  const [tests, setTests] = useState<TestCase[]>(getInitialTests);
  const [showCamera, setShowCamera] = useState(true);

  // Initialize event tracking
  const { emit } = useCodingEvents({
    sessionId: id,
    roundId: `coding-${id}`,
    problemId: currentProblem.id,
    problemTitle: currentProblem.title,
    problemDifficulty: currentProblem.difficulty,
    problemConstraints: currentProblem.constraints,
    examplesCount: currentProblem.examples.length,
    timeLimitMin: 15,
  });

  // Initialize idle timer (90 seconds)
  const { reset: resetIdleTimer } = useIdleTimer({
    timeout: 90_000,
    onIdle: () => {
      // Check if there are failing tests before emitting idle event
      const hasFailures = tests.some((t) => t.status === "fail");
      if (hasFailures) {
        emit("idle_timer_fired", { idleForMs: 90000 });
      }
    },
  });

  // Voice integration state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [showTranscript, setShowTranscript] = useState(false); // Closed by default
  
  // Time tracking for interview duration
  const [elapsedTime, setElapsedTime] = useState(0);
  const [maxTime, setMaxTime] = useState(15 * 60); // Default 15 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLimitSentRef = useRef(false);
  
  // Interview completion state
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [finalDuration, setFinalDuration] = useState(0);

  // Handle transcript updates from voice
  const handleTranscriptUpdate = useCallback((entry: TranscriptEntry) => {
    setTranscript((prev) => {
      // Update last entry if same role, otherwise add new
      if (prev.length > 0 && prev[prev.length - 1].role === entry.role) {
        const updated = [...prev];
        updated[updated.length - 1] = entry;
        return updated;
      }
      return [...prev, entry];
    });
  }, []);

  // Audio hook for capture/playback (must be before useInterviewVoice to use stopCapture)
  const {
    isCapturing,
    startCapture,
    stopCapture,
    playAudio,
  } = useInterviewAudio();

  // Voice hook for WebSocket connection to XAI
  const {
    isConnected: voiceConnected,
    status: voiceStatus,
    connect: connectVoice,
    disconnect: disconnectVoice,
    sendAudio,
    sendContext,
    error: voiceError,
  } = useInterviewVoice({
    onTranscriptUpdate: handleTranscriptUpdate,
    onSessionEnd: () => {
      console.log("[Coding Interview] Session ended by voice agent");
      // Stop voice and capture when agent ends session
      stopCapture();
      disconnectVoice();
      setVoiceEnabled(false);
      setIsActive(false);
      setFinalDuration(elapsedTime);
      setInterviewComplete(true);
      timeLimitSentRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    },
  });

  // Client-side VAD disabled - has SSR issues with Next.js + ONNX Runtime
  // Server VAD is used instead, with strict prompts to prevent filler sounds

  // Bridge EventBus to voice agent
  useCodingVoice({
    sendContext,
    isConnected: voiceConnected,
    enabled: voiceEnabled && voiceConnected,
  });

  // Listen for audio events from voice
  useEffect(() => {
    const handleAudioEvent = (event: CustomEvent<string>) => {
      if (event.detail) {
        playAudio(event.detail);
      }
    };
    window.addEventListener("interview-audio", handleAudioEvent as EventListener);
    return () => {
      window.removeEventListener("interview-audio", handleAudioEvent as EventListener);
    };
  }, [playAudio]);

  // Timer effect
  useEffect(() => {
    if (isActive && voiceEnabled) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, voiceEnabled]);

  // Time limit enforcement - tell AI to wrap up when time is reached
  useEffect(() => {
    if (isActive && elapsedTime >= maxTime && voiceConnected && !timeLimitSentRef.current) {
      console.log("[Coding Interview] ⏰ Time limit reached, sending wrap-up signal to AI");
      sendContext("[TIME WARNING] Interview time is complete. You must wrap up now. Say your closing phrase immediately: 'Thank you for your time today. We'll review your solution and be in touch about next steps. Best of luck!'", { triggerResponse: true });
      timeLimitSentRef.current = true;
    }
  }, [elapsedTime, maxTime, isActive, voiceConnected, sendContext]);

  // Stop interview handler
  const handleStopInterview = () => {
    console.log("[Coding Interview] 🛑 Manually stopping interview");
    stopCapture();
    disconnectVoice();
    setVoiceEnabled(false);
    setIsActive(false);
    setFinalDuration(elapsedTime);
    setInterviewComplete(true);
    timeLimitSentRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Toggle voice on/off
  const toggleVoice = async () => {
    if (voiceEnabled) {
      handleStopInterview();
    } else {
      try {
        // Start capture first to get sample rate
        const detectedSampleRate = await startCapture(sendAudio);
        
        // Build full context to send to session API (handles server restarts)
        const context = {
          candidateId: candidate?.id,
          // Send full candidate data so server can recreate if needed
          candidateData: candidate ? {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            jobId: candidate.jobId,
            resumeSummary: candidate.resumeSummary,
          } : undefined,
          // Send full job data so server can recreate if needed
          jobData: job ? {
            id: job.id,
            title: job.title,
            company: job.company,
            description: job.description,
            requirements: job.requirements,
            interviewConfig: job.interviewConfig,
          } : undefined,
        };
        
        // Then connect voice with detected sample rate and context
        await connectVoice("coding", id, detectedSampleRate, context);
        setVoiceEnabled(true);
        setIsActive(true);
        setElapsedTime(0);
        timeLimitSentRef.current = false;
      } catch (err) {
        console.error("[Coding] Failed to start voice:", err);
        alert(`Failed to start voice: ${err}`);
      }
    }
  };

  // Reset code and tests when problem changes
  useEffect(() => {
    setCode(currentProblem.starterCode.python);
    setTests(convertToDisplayTests(currentProblem.testCases));
    setLanguage("python");
  }, [currentProblem]);

  // Initialize Python runner (only loads when language is Python)
  const { isLoading, isRunning, runTests, runSingleTest } = usePythonRunner();
  const isPython = language === "python";

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const starterCode = lang === "python" 
      ? currentProblem.starterCode.python 
      : lang === "javascript" || lang === "typescript"
        ? currentProblem.starterCode.javascript
        : currentProblem.starterCode.cpp;
    setCode(starterCode);
    // Reset tests when switching languages
    setTests(convertToDisplayTests(currentProblem.testCases));
    // Reset idle timer on language change
    resetIdleTimer();
  };

  const handleCodeDelta = (data: CodeDeltaData) => {
    emit("code_delta", data);
    resetIdleTimer(); // Reset idle timer on code change
  };

  const handleHelpRequested = () => {
    emit("help_requested", { channel: "button" });
    resetIdleTimer();
  };

  const handleTimeCheckpoint = (minutesLeft: number) => {
    emit("time_checkpoint", { minutesLeft });
  };

  const handleRunAll = async () => {
    // Emit run_tests_requested event
    emit("run_tests_requested", { reason: "user_click" });
    resetIdleTimer(); // Reset idle timer on test run

    if (isPython) {
      // Real Python execution
      try {
        // Mark all tests as running
        setTests((prev) =>
          prev.map((test) => ({
            ...test,
            status: "running" as TestCaseStatus,
          }))
        );

        // Convert tests to structured format
        const defaultFunctionName = currentProblem.testCases[0]?.functionName || "solution";
        const structuredTestsToRun: StructuredTestCase[] = tests.map((test) => ({
          name: test.name,
          functionName: test.functionName || defaultFunctionName,
          args: test.args || [],
          expected: test.expected !== undefined ? test.expected : JSON.parse(test.expectedOutput || "null"),
        }));

        const startTime = performance.now();

        // Execute tests
        const results = await runTests(code, structuredTestsToRun);

        const durationMs = Math.round(performance.now() - startTime);

        // Update tests with results
        setTests((prev) =>
          prev.map((test, i) => {
            const result = results[i];
            if (!result) return test;

            return {
              ...test,
              status: result.status === "pass" ? ("pass" as TestCaseStatus) : result.status === "timeout" ? ("fail" as TestCaseStatus) : ("fail" as TestCaseStatus),
              actual: result.actual,
              actualOutput: JSON.stringify(result.actual),
              expected: result.expected,
              stdout: result.stdout,
              error: result.error,
              executionTime: result.executionTime,
            };
          })
        );

        // Emit test_result event with detailed context for voice agent
        const passedTests = results.filter((r) => r.status === "pass").length;
        const failingTests = results
          .map((r, i) => ({ result: r, test: tests[i], index: i }))
          .filter(({ result }) => result.status !== "pass")
          .map(({ result, test, index }) => ({
            name: test?.name || `Test ${index + 1}`,
            input: test?.input || `${test?.functionName}(${(test?.args || []).map(a => JSON.stringify(a)).join(", ")})`,
            expected: JSON.stringify(result.expected),
            actual: JSON.stringify(result.actual),
            msg: result.error || `Expected ${JSON.stringify(result.expected)}, got ${JSON.stringify(result.actual)}`,
          }));

        const testResultData: TestResultData = {
          status: failingTests.length === 0 ? "pass" : "fail",
          failingTests: failingTests.length > 0 ? failingTests : undefined,
          durationMs,
          totalTests: results.length,
          passedTests,
        };

        emit("test_result", testResultData);
      } catch (error: any) {
        // Handle execution errors
        setTests((prev) =>
          prev.map((test) => ({
            ...test,
            status: "fail" as TestCaseStatus,
            error: error.message || "Execution failed",
          }))
        );

        // Emit error event
        emit("runtime_error", {
          message: error.message || "Execution failed",
        });
      }
    } else {
      // Mock execution for other languages (for now)
      setTests((prev) =>
        prev.map((test) => ({
          ...test,
          status: test.status === "pending" ? ("running" as TestCaseStatus) : test.status,
        }))
      );
      setTimeout(() => {
        setTests((prev) =>
          prev.map((test) => ({
            ...test,
            status: test.status === "running" ? ("pass" as TestCaseStatus) : test.status,
          }))
        );
      }, 1000);
    }
  };

  const handleRunTest = async (index: number) => {
    if (isPython) {
      // Real Python execution for single test
      try {
        setTests((prev) =>
          prev.map((test, i) =>
            i === index ? { ...test, status: "running" as TestCaseStatus } : test
          )
        );

        const test = tests[index];
        if (!test.functionName || !test.args) {
          throw new Error("Invalid test case format");
        }

        const structuredTest: StructuredTestCase = {
          name: test.name,
          functionName: test.functionName,
          args: test.args,
          expected: test.expected !== undefined ? test.expected : JSON.parse(test.expectedOutput || "null"),
        };

        const result = await runSingleTest(code, structuredTest, index);

        setTests((prev) =>
          prev.map((test, i) => {
            if (i !== index) return test;
            return {
              ...test,
              status: result.status === "pass" ? ("pass" as TestCaseStatus) : ("fail" as TestCaseStatus),
              actual: result.actual,
              actualOutput: JSON.stringify(result.actual),
              expected: result.expected,
              stdout: result.stdout,
              error: result.error,
              executionTime: result.executionTime,
            };
          })
        );
      } catch (error: any) {
        setTests((prev) =>
          prev.map((test, i) =>
            i === index
              ? {
                  ...test,
                  status: "fail" as TestCaseStatus,
                  error: error.message || "Execution failed",
                }
              : test
          )
        );
      }
    } else {
      // Mock execution for other languages
      setTests((prev) =>
        prev.map((test, i) =>
          i === index ? { ...test, status: "running" as TestCaseStatus } : test
        )
      );
      setTimeout(() => {
        setTests((prev) =>
          prev.map((test, i) =>
            i === index ? { ...test, status: "pass" as TestCaseStatus } : test
          )
        );
      }, 500);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[--grok-dark]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[--color-border] bg-[--grok-gray-900] px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href={`/interview/${id}`}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-8 px-3 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
          >
            <ArrowLeft className="size-4" />
              Back
            </Link>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[--grok-accent]/10 text-[--grok-accent] border-[--grok-accent]/20">
                Round 3
              </Badge>
              <span className="font-semibold text-[--grok-white]">Coding Interview</span>
            </div>
            <p className="text-xs text-muted-foreground">Session {id}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Voice Toggle + Status */}
          <Button
            size="sm"
            variant={voiceEnabled ? "default" : "outline"}
            onClick={toggleVoice}
            className={voiceEnabled ? "bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black" : ""}
          >
            {voiceEnabled ? (
              <>
                <Mic className="size-3 mr-1 animate-pulse" />
                {voiceStatus === "connecting" ? "Connecting..." : "Voice On"}
              </>
            ) : (
              <>
                <MicOff className="size-3 mr-1" />
                Voice Off
              </>
            )}
          </Button>
          {/* Stop Interview Button */}
          {voiceEnabled && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStopInterview}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="size-3 mr-1" />
              End Interview
            </Button>
          )}
          {/* AI Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs bg-[--grok-gray-800] border border-[--color-border]">
            <Brain className={`size-3.5 ${voiceConnected ? "text-green-500" : "text-[--grok-gray-400]"}`} />
            <span className="text-[--grok-gray-300]">
              {voiceConnected ? "AI listening" : "AI ready"}
            </span>
          </div>
          <CodingTimer
            timeLimitMinutes={10}
            onTimeCheckpoint={handleTimeCheckpoint}
          />
          <LanguageSelector value={language} onChange={handleLanguageChange} />
          <HelpButton onHelpRequested={handleHelpRequested} />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunAll}
              disabled={isPython && (isLoading || isRunning)}
            >
              {isPython && (isLoading || isRunning) ? (
                <Loader2 className="size-3 mr-1 animate-spin" />
              ) : (
                <Play className="size-3 mr-1" />
              )}
              {isPython && isLoading ? "Loading..." : isPython && isRunning ? "Running..." : "Run Code"}
            </Button>
            <Button size="sm" className="bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black font-semibold">
              <Send className="size-3 mr-1" />
              Submit
            </Button>
          </div>
        </div>
      </header>

      {/* Main IDE Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Problem Description Tabs */}
        <div className="w-[400px] flex-shrink-0">
          <IdeTabs problem={problem} hints={hints} />
        </div>

        {/* Right Panel - Editor & Tests */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              language={language}
              value={code}
              onChange={(val) => setCode(val || "")}
              height="100%"
              onCodeDelta={handleCodeDelta}
            />
          </div>

          {/* Test Cases Panel */}
          <div className="h-[300px] flex-shrink-0">
            <TestRunner tests={tests} onRunAll={handleRunAll} onRunTest={handleRunTest} />
          </div>
        </div>
      </div>

      {/* Draggable Camera PiP */}
      {showCamera && <DraggableCamera onClose={() => setShowCamera(false)} />}

      {/* Transcript Panel */}
      <TranscriptPanel
        transcript={transcript}
        isOpen={showTranscript}
        onToggle={() => setShowTranscript(!showTranscript)}
      />

      {/* Interview Complete Overlay */}
      {interviewComplete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-lg mx-4 bg-[--grok-gray-900] border-[--grok-accent]/30">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 size-16 rounded-full bg-[--grok-accent]/20 flex items-center justify-center">
                <Trophy className="size-8 text-[--grok-accent]" />
              </div>
              <CardTitle className="text-2xl text-[--grok-white]">Interview Complete!</CardTitle>
              <p className="text-[--grok-gray-400] mt-2">
                Great job completing the coding interview.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-[--grok-gray-800]">
                  <Clock className="size-5 mx-auto mb-1 text-[--grok-accent]" />
                  <p className="text-lg font-semibold text-[--grok-white]">
                    {Math.floor(finalDuration / 60)}:{(finalDuration % 60).toString().padStart(2, '0')}
                  </p>
                  <p className="text-xs text-[--grok-gray-400]">Duration</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[--grok-gray-800]">
                  <Code2 className="size-5 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-semibold text-[--grok-white]">
                    {tests.filter(t => t.status === 'pass').length}/{tests.length}
                  </p>
                  <p className="text-xs text-[--grok-gray-400]">Tests Passed</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[--grok-gray-800]">
                  <CheckCircle2 className="size-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-semibold text-[--grok-white]">
                    {transcript.length}
                  </p>
                  <p className="text-xs text-[--grok-gray-400]">Exchanges</p>
                </div>
              </div>

              {/* Problem Info */}
              <div className="p-4 rounded-lg bg-[--grok-gray-800] border border-[--color-border]">
                <p className="text-sm text-[--grok-gray-400] mb-1">Problem Attempted</p>
                <p className="font-medium text-[--grok-white]">{problem.title}</p>
                <Badge 
                  variant="secondary" 
                  className={`mt-2 ${
                    problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                    problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}
                >
                  {problem.difficulty}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Link href={`/interview/${id}/summary`} className="w-full">
                  <Button className="w-full bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black font-semibold">
                    <CheckCircle2 className="size-4 mr-2" />
                    View Interview Summary
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => setInterviewComplete(false)}
                  className="w-full"
                >
                  Back to Problem
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Main export with Suspense boundary for useSearchParams
export default function CodingRound({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[--grok-dark]">
        <Loader2 className="size-8 animate-spin text-[--grok-accent]" />
      </div>
    }>
      <CodingRoundInner id={id} />
    </Suspense>
  );
}
