/**
 * Interviews API
 * Create and manage interview sessions
 */

import { NextResponse } from "next/server";
import { InterviewSession, RoundResult } from "@/lib/types";
import { 
  interviewsStore, 
  candidatesStore, 
  getJob, 
  addInterview,
  getInterviewByCandidateId 
} from "@/lib/store";

const createEmptyRound = (duration: number): RoundResult => ({
  status: "pending",
  score: 0,
  transcript: [],
  feedback: "",
  duration,
});

/**
 * GET /api/interviews
 * Get all interviews
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get("candidateId");

  let filtered = interviewsStore;

  if (candidateId) {
    filtered = filtered.filter((i) => i.candidateId === candidateId);
  }

  return NextResponse.json({
    interviews: filtered,
    total: filtered.length,
  });
}

/**
 * POST /api/interviews
 * Create a new interview session for a candidate
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json(
        { error: "Missing candidateId" },
        { status: 400 }
      );
    }

    // Check if candidate exists
    const candidate = candidatesStore.find((c) => c.id === candidateId);
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check if interview already exists for this candidate
    const existingInterview = getInterviewByCandidateId(candidateId);
    if (existingInterview) {
      return NextResponse.json({
        success: true,
        interview: existingInterview,
        existing: true,
      });
    }

    // Get job details for interview config
    const job = getJob(candidate.jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found for candidate" },
        { status: 404 }
      );
    }

    // Create new interview session
    const newInterview: InterviewSession = {
      id: `int-${Date.now()}`,
      candidateId,
      jobId: candidate.jobId,
      createdAt: new Date().toISOString(),
      rounds: {
        hr: createEmptyRound(job.interviewConfig.hrDuration),
        technical: createEmptyRound(job.interviewConfig.technicalDuration),
        coding: job.interviewConfig.codingEnabled 
          ? createEmptyRound(job.interviewConfig.codingDuration)
          : undefined,
      },
      overallScore: 0,
      status: "scheduled",
    };

    addInterview(newInterview);

    console.log(`[Interviews API] Created interview ${newInterview.id} for candidate ${candidate.name}`);

    return NextResponse.json({
      success: true,
      interview: newInterview,
      existing: false,
    });
  } catch (error) {
    console.error("[Interviews API] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
}
