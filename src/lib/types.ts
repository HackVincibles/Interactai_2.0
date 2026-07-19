export type RoundStatus = "pending" | "in-progress" | "completed";

export interface TranscriptEntry {
  timestamp: string;
  role: "candidate" | "assistant";
  content: string;
}

export interface CompetencyScores {
  technicalProficiency: number;
  problemSolving: number;
  communication: number;
  cultureFit: number;
  leadership?: number;
}

export interface AIInsights {
  strengths: string[];
  areasForGrowth: string[];
  redFlags: string[];
  recommendation: "strong-hire" | "hire" | "maybe" | "no-hire";
  confidence: number; // 0-100
}

export interface RoundResult {
  status: RoundStatus;
  score: number;
  transcript: TranscriptEntry[];
  feedback: string;
  duration: number; // minutes
  competencies?: CompetencyScores;
  insights?: AIInsights;
  highlights?: string[]; // Notable quotes from transcript
  // Cross-round context (generated after round completes)
  handoff?: RoundHandoffData;
}

/**
 * Lightweight handoff data stored with round results
 * Full RoundHandoff type is in round-handoff.ts
 */
export interface RoundHandoffData {
  topicsDiscussed: string[];
  candidateClaims: Array<{
    claim: string;
    context: string;
    technologies?: string[];
    verifiable: boolean;
  }>;
  areasToExplore: Array<{
    topic: string;
    reason: string;
    suggestedApproach?: string;
  }>;
  positiveSignals: string[];
  discussionPoints: Array<{
    topic: string;
    candidateResponse: string;
    referencePhrase?: string;
  }>;
  completedAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  interviewConfig: {
    hrDuration: number;
    technicalDuration: number;
    codingEnabled: boolean;
    codingDuration: number;
  };
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  // Parsed resume content for AI to use during interview
  resumeSummary?: string;
  jobId: string;
  status: "pending" | "scheduled" | "in-progress" | "completed" | "rejected";
  createdAt?: string;
  notes?: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  jobId: string;
  rounds: {
    hr: RoundResult;
    technical: RoundResult;
    coding?: RoundResult;
  };
  overallScore: number;
  status: "scheduled" | "in-progress" | "completed";
  createdAt?: string;
  completedAt?: string;
  overallInsights?: AIInsights;
  overallCompetencies?: CompetencyScores;
}

export interface InterviewRoundConfig {
  label: string;
  path: string;
  duration: string;
  description: string;
}

