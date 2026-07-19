"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  MessageSquare, 
  User, 
  Bot, 
  Play, 
  Square,
  SkipForward,
  Lightbulb,
  CheckCircle2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Loader2,
  AlertCircle,
  Volume2,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Code2,
  Brain,
  Database,
  Network,
} from "lucide-react";
import { interviews as mockInterviews, candidates as mockCandidates, jobs } from "@/lib/mock-data";
import { useInterviewVoice } from "@/hooks/use-interview-voice";
import { useInterviewAudio } from "@/hooks/use-interview-audio";
import { useRoundHandoff } from "@/hooks/use-round-handoff";
// Client VAD disabled - has SSR issues with Next.js + ONNX Runtime
// import { useTechnicalInterviewVAD } from "@/hooks/use-client-vad";
import type { TranscriptEntry, CompetencyScores, AIInsights, Candidate, InterviewSession } from "@/lib/types";

interface AnalysisResult {
  score: number;
  competencies: CompetencyScores;
  insights: AIInsights;
  summary: string;
  highlights: string[];
  concerns: string[];
}

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

export default function TechnicalRound({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  // Try to find session from mock data first
  const mockSession = mockInterviews.find((i) => i.id === id);
  
  // State for dynamically loaded data
  const [session, setSession] = useState<InterviewSession | null>(mockSession || null);
  const [candidate, setCandidate] = useState<Candidate | null>(() => {
    if (mockSession) {
      return mockCandidates.find((c) => c.id === mockSession.candidateId) || null;
    }
    
    // Try to find candidate via interview mapping in localStorage
    const candidateId = getInterviewMapping(id);
    if (candidateId) {
      // Check mock data first
      const mockCandidate = mockCandidates.find(c => c.id === candidateId);
      if (mockCandidate) return mockCandidate;
      
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
  const job = session ? jobs.find((j) => j.id === session.jobId) : 
              candidate ? jobs.find((j) => j.id === candidate.jobId) : null;
  
  // Load interview data from API if not in mock data
  useEffect(() => {
    if (!mockSession && id.startsWith("int-")) {
      // First check localStorage mapping
      const candidateId = getInterviewMapping(id);
      if (candidateId && !candidate) {
        const storedCandidates = getStoredCandidates();
        const found = storedCandidates.find(c => c.id === candidateId);
        if (found) {
          setCandidate(found);
          return;
        }
      }
      
      // Fallback: get most recent candidate from localStorage
      const storedCandidates = getStoredCandidates();
      if (storedCandidates.length > 0 && !candidate) {
        const sorted = storedCandidates.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setCandidate(sorted[0]);
      }
    }
  }, [id, mockSession, candidate]);
  
  // Interview state
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  
  // Calculate maxTime to prevent hydration mismatch
  // Initialize with default value (5 minutes = 300 seconds) to ensure consistent initial render
  const [maxTime, setMaxTime] = useState(5 * 60);
  
  // Analysis state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Handoff state (for cross-round context)
  const [handoffGenerated, setHandoffGenerated] = useState(false);
  const { generateHandoff, isGenerating: isGeneratingHandoff } = useRoundHandoff();
  
  // Track if component is mounted to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Audio hook
  const { 
    isCapturing, 
    startCapture, 
    stopCapture, 
    stopPlayback,
    playAudio,
    audioLevel 
  } = useInterviewAudio();

  // Handle transcript updates
  const handleTranscriptUpdate = useCallback((entry: TranscriptEntry) => {
    setTranscript((prev) => {
      // Check if we should update the last entry or add new
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.role === entry.role) {
          // Update the last entry
          const newTranscript = [...prev];
          newTranscript[newTranscript.length - 1] = entry;
          return newTranscript;
        }
      }
      // Add new entry
      return [...prev, entry];
    });
  }, []);

  // Voice hook
  const {
    isConnected,
    status,
    connect,
    disconnect,
    sendAudio,
    sendContext,
    error,
  } = useInterviewVoice({
    onTranscriptUpdate: handleTranscriptUpdate,
    onSessionEnd: () => {
      console.log("[Technical Interview] Session ended by voice agent");
      handleStop();
    },
  });

  // Client-side VAD disabled - has SSR issues with Next.js + ONNX Runtime
  // Server VAD is used instead, with strict prompts to prevent filler sounds

  // Listen for audio events from the voice hook
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

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Timer effect
  useEffect(() => {
    if (isActive) {
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
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update maxTime when job is available to prevent hydration mismatch
  useEffect(() => {
    const duration = job?.interviewConfig.technicalDuration || 5; // Default 5 minutes
    setMaxTime(duration * 60); // Convert to seconds
  }, [job]);

  // Time limit enforcement - tell AI to wrap up when time is reached
  const timeLimitSentRef = useRef(false);
  useEffect(() => {
    if (isActive && elapsedTime >= maxTime && isConnected && !timeLimitSentRef.current) {
      console.log("[Technical Interview] ⏰ Time limit reached, sending wrap-up signal to AI");
      sendContext("[TIME WARNING] Interview time is complete. You must wrap up now. Say your closing phrase immediately: 'Thank you for your time today. We'll be in touch about next steps. Best of luck!'", { triggerResponse: true });
      timeLimitSentRef.current = true;
    }
  }, [elapsedTime, maxTime, isActive, isConnected, sendContext]);

  // Set mounted flag after hydration to prevent mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays after srcObject is set
        await videoRef.current.play().catch(() => {
          // Autoplay may fail silently, that's ok - video will show when user interacts
        });
      }
      setIsCameraOn(true);
    } catch (err) {
      console.error("Failed to start camera:", err);
      // Handle permission denied gracefully
      if (err instanceof Error && err.name === "NotAllowedError") {
        alert("Camera access denied. Please allow camera permissions to use video.");
      }
      setIsCameraOn(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // Start interview
  const handleStart = async () => {
    try {
      setTranscript([]);
      setElapsedTime(0);
      timeLimitSentRef.current = false; // Reset time limit flag
      
      // Start audio capture first to get sample rate
      const sampleRate = await startCapture((base64Audio) => {
        sendAudio(base64Audio);
      });

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

      // Connect to XAI voice API with full context - use "technical" roundType
      await connect("technical", id, sampleRate, context);
      
      setIsActive(true);
    } catch (err) {
      console.error("Failed to start interview:", err);
      alert(`Failed to start interview: ${err}`);
    }
  };

  // Stop interview
  // Stop interview and generate handoff for next round
  const handleStop = async () => {
    stopCapture();
    stopPlayback();
    disconnect();
    setIsActive(false);
    timeLimitSentRef.current = false; // Reset time limit flag
    
    // Generate handoff context for the Coding round
    if (transcript.length > 0 && !handoffGenerated) {
      console.log("%c[TECHNICAL] 🔄 Generating handoff for Coding round...", "color: #2196F3; font-weight: bold; font-size: 14px");
      const result = await generateHandoff(id, "technical", transcript);
      if (result.success) {
        setHandoffGenerated(true);
        console.log("%c[TECHNICAL] ✅ Handoff ready! Coding interviewer will know about:", "color: #4CAF50; font-weight: bold");
        console.log(`%c  📋 Topics discussed: ${result.topicsDiscussed}`, "color: #9C27B0");
        console.log(`%c  🎯 Claims verified: ${result.candidateClaims}`, "color: #FF9800");
        console.log(`%c  🔍 Areas to explore: ${result.areasToExplore}`, "color: #03A9F4");
      } else {
        console.log("%c[TECHNICAL] ❌ Handoff generation failed", "color: red");
      }
    }
  };

  // Analyze interview transcript and generate handoff
  const handleAnalyze = async () => {
    if (transcript.length === 0) {
      alert("No transcript to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/interview/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundType: "technical",
          jobTitle: job?.title || "Unknown",
          company: job?.company || "Unknown",
          transcript,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const result: AnalysisResult = await response.json();
      setAnalysis(result);
      
      // Also generate handoff for Coding round if not already done
      if (!handoffGenerated) {
        console.log("[Technical Interview] Generating handoff alongside analysis...");
        const handoffResult = await generateHandoff(id, "technical", transcript);
        if (handoffResult.success) {
          setHandoffGenerated(true);
        }
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Failed to analyze interview");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Toggle mic (mute/unmute)
  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    // Note: Actual muting would require modifying the audio capture
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopCapture();
      disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/interview/${id}`}>
                  <ArrowLeft className="size-4 mr-1" />
                  Exit
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    Round 2
                  </Badge>
                  <span className="font-semibold">Technical Interview</span>
                </div>
                <p className="text-xs text-muted-foreground">Role-aligned technical assessment</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span className="font-mono font-medium">{formatTime(elapsedTime)}</span>
                <span className="text-muted-foreground">/ {formatTime(maxTime)}</span>
              </div>
              <Button variant="outline" size="sm" asChild className={handoffGenerated ? "border-green-500/30" : ""}>
                <Link href={`/interview/${id}/coding`}>
                  {handoffGenerated && <CheckCircle2 className="size-3 mr-1 text-green-500" />}
                  Coding Round
                  <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Video Area */}
          <div className="lg:col-span-8 space-y-4">
            {/* Video Panel */}
            <Card className="overflow-hidden">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Technical Interview Session</CardTitle>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      <Volume2 className="size-3 mr-1 animate-pulse" />
                      Connected
                    </Badge>
                  )}
                  {status === "connecting" && (
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                      <Loader2 className="size-3 mr-1 animate-spin" />
                      Connecting...
                    </Badge>
                  )}
                  {error && (
                    <Badge variant="outline" className="text-red-500 border-red-500/30">
                      <AlertCircle className="size-3 mr-1" />
                      Error
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  {/* Always render video element so ref is available when stream starts */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isCameraOn ? '' : 'hidden'}`}
                  />
                  {!isCameraOn && (
                    <div className="text-muted-foreground text-sm">Camera off</div>
                  )}
                  
                  {/* Audio level indicator */}
                  {isActive && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-75 ${
                              audioLevel * 20 > i ? "bg-green-500" : "bg-gray-600"
                            }`}
                            style={{ height: `${8 + i * 4}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-white/70">
                        {isCapturing ? "Listening..." : "Mic off"}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Media Controls */}
                <div className="flex items-center justify-center gap-3 p-3 bg-muted/30">
                  <Button
                    variant={isCameraOn ? "secondary" : "outline"}
                    size="sm"
                    onClick={toggleCamera}
                  >
                    {isCameraOn ? <Video className="size-4 mr-2" /> : <VideoOff className="size-4 mr-2" />}
                    Camera {isCameraOn ? "on" : "off"}
                  </Button>
                  <Button
                    variant={isMicOn ? "secondary" : "outline"}
                    size="sm"
                    onClick={toggleMic}
                    disabled={!isActive}
                  >
                    {isMicOn ? <Mic className="size-4 mr-2" /> : <MicOff className="size-4 mr-2" />}
                    Mic {isMicOn ? "on" : "off"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-card/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button 
                      size="lg" 
                      onClick={isActive ? handleStop : handleStart}
                      disabled={status === "connecting"}
                      className={isActive ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}
                    >
                      {status === "connecting" ? (
                        <Loader2 className="size-5 mr-2 animate-spin" />
                      ) : isActive ? (
                        <Square className="size-5 mr-2" />
                      ) : (
                        <Play className="size-5 mr-2" />
                      )}
                      {status === "connecting" ? "Connecting..." : isActive ? "Stop Interview" : "Start Interview"}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleAnalyze}
                      disabled={isActive || transcript.length === 0 || isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="size-4 mr-2" />
                      )}
                      {isAnalyzing ? "Analyzing..." : "Generate Scorecard"}
                    </Button>
                  </div>
                  <Badge variant="outline" className={isActive ? "text-green-500 border-green-500/30" : "text-muted-foreground"}>
                    {isActive ? "● Recording" : "○ Standby"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Technical Focus Areas */}
            <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-transparent">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-blue-500">
                  <Code2 className="size-4" />
                  <CardTitle className="text-sm font-medium">Assessment Areas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10">
                    <Code2 className="size-4 text-blue-500" />
                    <span className="text-sm">Fundamentals</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10">
                    <Network className="size-4 text-blue-500" />
                    <span className="text-sm">System Design</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10">
                    <Brain className="size-4 text-blue-500" />
                    <span className="text-sm">Problem-Solving</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10">
                    <Database className="size-4 text-blue-500" />
                    <span className="text-sm">Architecture</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Questions will be tailored to the role requirements and candidate's resume experience.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Transcript */}
            <Card className="h-[400px] flex flex-col">
              <CardHeader className="pb-2 flex-none">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Live Transcript</CardTitle>
                  <Badge variant="secondary">{transcript.length} entries</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-6 pb-4" ref={scrollRef}>
                  {transcript.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      {isActive 
                        ? "Waiting for conversation..." 
                        : "Transcript will appear here once the interview starts..."}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {transcript.map((entry, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            {entry.role === "assistant" ? (
                              <Bot className="size-4 text-blue-500" />
                            ) : (
                              <User className="size-4 text-green-500" />
                            )}
                            <span className="text-xs font-medium capitalize">
                              {entry.role === "assistant" ? "Marcus" : "Candidate"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm pl-6">{entry.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysis && (
              <Card className="border-2 border-blue-500/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Technical Scorecard</CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={
                        analysis.insights.recommendation === "strong-hire" ? "bg-green-500/20 text-green-500" :
                        analysis.insights.recommendation === "hire" ? "bg-emerald-500/20 text-emerald-500" :
                        analysis.insights.recommendation === "maybe" ? "bg-yellow-500/20 text-yellow-500" :
                        "bg-red-500/20 text-red-500"
                      }
                    >
                      {analysis.insights.recommendation === "strong-hire" && <ThumbsUp className="size-3 mr-1" />}
                      {analysis.insights.recommendation === "hire" && <ThumbsUp className="size-3 mr-1" />}
                      {analysis.insights.recommendation === "maybe" && <AlertTriangle className="size-3 mr-1" />}
                      {analysis.insights.recommendation === "no-hire" && <ThumbsDown className="size-3 mr-1" />}
                      {analysis.insights.recommendation.replace("-", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Overall Score */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-500">{analysis.score}</div>
                    <div className="text-xs text-muted-foreground">Technical Score</div>
                  </div>

                  {/* Competencies */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Competencies</div>
                    {Object.entries(analysis.competencies).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs w-24 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Progress value={value} className="flex-1 h-1.5" />
                        <span className="text-xs w-8 text-right">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Summary</div>
                    <p className="text-sm">{analysis.summary}</p>
                  </div>

                  {/* Strengths */}
                  {analysis.insights.strengths.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-green-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <TrendingUp className="size-3" /> Strengths
                      </div>
                      <ul className="text-xs space-y-1">
                        {analysis.insights.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-green-500">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Red Flags */}
                  {analysis.insights.redFlags.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <TrendingDown className="size-3" /> Concerns
                      </div>
                      <ul className="text-xs space-y-1">
                        {analysis.insights.redFlags.map((r, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-red-500">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confidence */}
                  <div className="text-xs text-muted-foreground text-center">
                    Analysis confidence: {analysis.insights.confidence}%
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interview Tips */}
            {!analysis && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Lightbulb className="size-4" />
                    <CardTitle className="text-sm font-medium">Technical Interview Tips</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-green-500 mt-0.5 flex-none" />
                    <span>Probe resume claims with specific technical questions</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-green-500 mt-0.5 flex-none" />
                    <span>Adjust difficulty based on candidate performance</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-green-500 mt-0.5 flex-none" />
                    <span>Focus on fundamentals relevant to the role</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Candidate Info */}
            {isMounted && candidate && job && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Candidate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{candidate.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applying for: {job.title} at {job.company}
                  </p>
                  {candidate.resumeSummary && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      Resume: {candidate.resumeSummary.substring(0, 100)}...
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
