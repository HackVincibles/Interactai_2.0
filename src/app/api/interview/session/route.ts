/**
 * Interview Session API Route
 * Creates ephemeral tokens for XAI voice sessions with custom prompts
 * 
 * CROSS-ROUND CONTEXT:
 * This API now fetches handoff data from previous rounds to provide
 * context to subsequent interviewers. This enables:
 * - Natural conversation continuity
 * - Verification of claims made in earlier rounds
 * - Building on previous discussions
 */

import { NextResponse } from "next/server";
import { 
  getInterviewPrompt, 
  getVoiceForRound,
  getTemperatureForRound,
  SESSION_CONFIG,
  type InterviewRoundType,
  type InterviewContext,
} from "@/lib/interview-prompts";
import { interviews as mockInterviews, jobs as mockJobs, candidates as mockCandidates } from "@/lib/mock-data";
import { getInterview, getJob, getCandidate, interviewsStore, candidatesStore, jobsStore } from "@/lib/store";
import { formatHandoffForPrompt, type RoundHandoff } from "@/lib/round-handoff";

// XAI API configuration
const XAI_API_KEY = process.env.XAI_API_KEY || "";
const SESSION_REQUEST_URL = "https://api.x.ai/v1/realtime/client_secrets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roundType, sessionId, candidateId, candidateData, jobData } = body as { 
      roundType: string; 
      sessionId: string;
      candidateId?: string;
      // Full context from client (used when server-side stores are empty)
      candidateData?: {
        id: string;
        name: string;
        email: string;
        jobId: string;
        resumeSummary?: string;
      };
      jobData?: {
        id: string;
        title: string;
        company: string;
        description?: string;
        requirements: string[];
        interviewConfig: {
          hrDuration: number;
          technicalDuration: number;
          codingDuration: number;
          codingEnabled?: boolean;
        };
      };
    };

    if (!roundType || !sessionId) {
      return NextResponse.json(
        { error: "Missing roundType or sessionId" },
        { status: 400 }
      );
    }

    if (!XAI_API_KEY) {
      return NextResponse.json(
        { error: "XAI_API_KEY not configured. Please add it to .env.local" },
        { status: 500 }
      );
    }

    // Try to find interview from multiple sources
    let interview = getInterview(sessionId);
    
    // If not in store, check mock data
    if (!interview) {
      interview = mockInterviews.find((i) => i.id === sessionId);
    }

    // If still not found, try to look up by pattern (int-timestamp) and find matching candidate
    if (!interview && sessionId.startsWith("int-")) {
      // For newly created interviews, we need to find the candidate and job info
      // The client should pass candidateId when starting new interviews
      const candId = candidateId || candidateData?.id;
      
      if (candId) {
        // Try to find candidate from stores first, then fall back to client-provided data
        let cand = getCandidate(candId) || 
                   candidatesStore.find(c => c.id === candId) ||
                   mockCandidates.find(c => c.id === candId);
        
        // If candidate not found in stores but client sent data, use that
        if (!cand && candidateData) {
          console.log(`[API] Using client-provided candidate data for: ${candidateData.name}`);
          cand = {
            id: candidateData.id,
            name: candidateData.name,
            email: candidateData.email,
            jobId: candidateData.jobId,
            resumeSummary: candidateData.resumeSummary,
            status: "pending",
            createdAt: new Date().toISOString(),
          };
          // Add to store for future lookups
          candidatesStore.unshift(cand);
        }
        
        if (cand) {
          // Try to find job from stores first, then fall back to client-provided data
          let job = getJob(cand.jobId) || 
                    jobsStore.find(j => j.id === cand.jobId) ||
                    mockJobs.find(j => j.id === cand.jobId);
          
          // If job not found in stores but client sent data, use that
          if (!job && jobData) {
            console.log(`[API] Using client-provided job data: ${jobData.title}`);
            job = {
              id: jobData.id,
              title: jobData.title,
              company: jobData.company,
              description: jobData.description || "",
              requirements: jobData.requirements,
              interviewConfig: {
                hrDuration: jobData.interviewConfig.hrDuration,
                technicalDuration: jobData.interviewConfig.technicalDuration,
                codingDuration: jobData.interviewConfig.codingDuration,
                codingEnabled: jobData.interviewConfig.codingEnabled ?? false,
              },
            };
          }
          
          if (job) {
            // Create a temporary interview object for this session
            interview = {
              id: sessionId,
              candidateId: cand.id,
              jobId: cand.jobId,
              createdAt: new Date().toISOString(),
              rounds: {
                hr: { status: "pending", score: 0, transcript: [], feedback: "", duration: job.interviewConfig.hrDuration },
                technical: { status: "pending", score: 0, transcript: [], feedback: "", duration: job.interviewConfig.technicalDuration },
              },
              overallScore: 0,
              status: "in-progress",
            };
            
            // Add to store for future lookups
            interviewsStore.unshift(interview);
            console.log(`[API] Created interview on-the-fly for candidate ${cand.name}`);
          }
        }
      }
    }

    if (!interview) {
      console.error(`[API] Interview not found: ${sessionId}`);
      console.error(`[API] candidateId: ${candidateId}, hasClientData: ${!!candidateData}`);
      return NextResponse.json(
        { error: "Interview session not found. Please ensure you have candidate data available." },
        { status: 404 }
      );
    }

    // Find job and candidate from multiple sources, with fallback to client-provided data
    let job = getJob(interview.jobId) || 
              jobsStore.find(j => j.id === interview.jobId) ||
              mockJobs.find((j) => j.id === interview.jobId);
    
    // Fall back to client-provided job data
    if (!job && jobData) {
      console.log(`[API] Using client-provided job data for context: ${jobData.title}`);
      job = {
        id: jobData.id,
        title: jobData.title,
        company: jobData.company,
        description: jobData.description || "",
        requirements: jobData.requirements,
        interviewConfig: {
          hrDuration: jobData.interviewConfig.hrDuration,
          technicalDuration: jobData.interviewConfig.technicalDuration,
          codingDuration: jobData.interviewConfig.codingDuration,
          codingEnabled: jobData.interviewConfig.codingEnabled ?? false,
        },
      };
    }
    
    let candidate = getCandidate(interview.candidateId) ||
                    candidatesStore.find(c => c.id === interview.candidateId) ||
                    mockCandidates.find((c) => c.id === interview.candidateId);
    
    // Fall back to client-provided candidate data
    if (!candidate && candidateData) {
      console.log(`[API] Using client-provided candidate data for context: ${candidateData.name}`);
      candidate = {
        id: candidateData.id,
        name: candidateData.name,
        email: candidateData.email,
        jobId: candidateData.jobId,
        resumeSummary: candidateData.resumeSummary,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
    }

    if (!job || !candidate) {
      console.error(`[API] Job or candidate not found for interview ${sessionId}`);
      console.error(`[API] Job ID: ${interview.jobId}, Candidate ID: ${interview.candidateId}`);
      console.error(`[API] Has client job data: ${!!jobData}, Has client candidate data: ${!!candidateData}`);
      return NextResponse.json(
        { error: "Job or candidate not found. Please ensure the interview was created properly." },
        { status: 404 }
      );
    }

    // Build cross-round context from previous rounds
    let previousRoundContext: string | undefined;
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[HANDOFF] Starting ${roundType.toUpperCase()} round for session ${sessionId}`);
    console.log(`${"=".repeat(60)}`);
    
    if (roundType === "technical" || roundType === "coding") {
      const handoffs: RoundHandoff[] = [];
      
      // Get HR round handoff for Technical/Coding
      if (interview.rounds?.hr?.handoff) {
        handoffs.push({
          ...interview.rounds.hr.handoff,
          roundType: "hr",
          duration: interview.rounds.hr.duration,
        } as RoundHandoff);
        console.log(`[HANDOFF] ✅ Found HR round handoff:`);
        console.log(`  - Topics: ${interview.rounds.hr.handoff.topicsDiscussed?.join(", ") || "none"}`);
        console.log(`  - Claims: ${interview.rounds.hr.handoff.candidateClaims?.length || 0}`);
        console.log(`  - Areas to explore: ${interview.rounds.hr.handoff.areasToExplore?.length || 0}`);
      } else {
        console.log(`[HANDOFF] ⚠️ No HR round handoff found - Technical interviewer won't have HR context`);
      }
      
      // Get Technical round handoff for Coding
      if (roundType === "coding" && interview.rounds?.technical?.handoff) {
        handoffs.push({
          ...interview.rounds.technical.handoff,
          roundType: "technical",
          duration: interview.rounds.technical.duration,
        } as RoundHandoff);
        console.log(`[HANDOFF] ✅ Found Technical round handoff:`);
        console.log(`  - Topics: ${interview.rounds.technical.handoff.topicsDiscussed?.join(", ") || "none"}`);
        console.log(`  - Claims: ${interview.rounds.technical.handoff.candidateClaims?.length || 0}`);
      } else if (roundType === "coding") {
        console.log(`[HANDOFF] ⚠️ No Technical round handoff found - Coding interviewer won't have Technical context`);
      }
      
      // Format handoffs for prompt injection
      if (handoffs.length > 0) {
        previousRoundContext = formatHandoffForPrompt(
          handoffs, 
          roundType as "technical" | "coding"
        );
        console.log(`[HANDOFF] ✅ Cross-round context generated (${handoffs.length} previous round(s))`);
        console.log(`[HANDOFF] Context preview (first 500 chars):\n${previousRoundContext.substring(0, 500)}...`);
      } else {
        console.log(`[HANDOFF] ❌ No previous round context available`);
      }
    } else {
      console.log(`[HANDOFF] ℹ️ HR round - no previous context needed`);
    }
    console.log(`${"=".repeat(60)}\n`);

    // Build interview context with resume and previous round context
    const context: InterviewContext = {
      candidateName: candidate.name,
      jobTitle: job.title,
      company: job.company,
      requirements: job.requirements,
      duration: getDurationForRound(roundType, job),
      resumeSummary: candidate.resumeSummary,
      previousRoundContext,
    };

    // Get the appropriate prompt, voice, and temperature for this round
    const instructions = getInterviewPrompt(roundType as InterviewRoundType, context);
    const voice = getVoiceForRound(roundType as InterviewRoundType);
    const temperature = getTemperatureForRound(roundType as InterviewRoundType);

    console.log(`[API] Creating session for ${roundType} interview`);
    console.log(`[API] Candidate: ${candidate.name}`);
    console.log(`[API] Role: ${job.title} at ${job.company}`);
    console.log(`[API] 🎙️  Voice: ${voice} (${roundType === "hr" ? "Sarah Chen - Female" : roundType === "technical" ? "Marcus Rivera - Male" : "Alex Chen - Male"})`);
    console.log(`[API] 🌡️  Temperature: ${temperature} (${roundType === "technical" ? "Lower for more controlled responses" : "Standard"})`);
    console.log(`[API] Resume available: ${!!candidate.resumeSummary}`);

    // Request ephemeral token from XAI
    const response = await fetch(SESSION_REQUEST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { seconds: 600 }, // 10 minute token for longer interviews
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] XAI token error: ${response.status} ${errorText}`);
      return NextResponse.json(
        { error: "Failed to create session", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json() as { value: string; expires_at: number };
    console.log(`[API] Session created successfully, expires: ${new Date(data.expires_at * 1000).toISOString()}`);

    return NextResponse.json({
      client_secret: {
        value: data.value,
        expires_at: data.expires_at,
      },
      voice,
      instructions,
      // Pass full session config for natural, agentic conversation
      sessionConfig: {
        temperature: temperature, // Round-specific temperature
        turnDetection: SESSION_CONFIG.turnDetection,
        modalities: SESSION_CONFIG.modalities,
        inputAudioTranscription: SESSION_CONFIG.inputAudioTranscription,
        maxResponseOutputTokens: SESSION_CONFIG.maxResponseOutputTokens,
      },
    });
  } catch (error) {
    console.error("[API] Session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

function getDurationForRound(roundType: string, job: { interviewConfig: { hrDuration: number; technicalDuration: number; codingDuration: number } }): number {
  switch (roundType) {
    case "hr":
      return job.interviewConfig.hrDuration;
    case "technical":
      return job.interviewConfig.technicalDuration;
    case "coding":
      return job.interviewConfig.codingDuration;
    default:
      return 15;
  }
}
