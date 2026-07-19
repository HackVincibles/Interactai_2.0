/**
 * Round Handoff Generation API
 * 
 * Called after each interview round completes to:
 * 1. Generate structured handoff context from the transcript
 * 2. Store it with the round results
 * 3. Enable cross-round context for subsequent interviews
 * 
 * This uses Grok 4.1 reasoning for high-quality insight extraction.
 */

import { NextResponse } from "next/server";
import { generateRoundHandoff } from "@/lib/round-handoff";
import { getInterview, getJob, interviewsStore } from "@/lib/store";
import { interviews as mockInterviews, jobs as mockJobs } from "@/lib/mock-data";
import type { TranscriptEntry } from "@/lib/types";

interface HandoffRequest {
  sessionId: string;
  roundType: "hr" | "technical" | "coding";
  transcript: TranscriptEntry[];
}

export async function POST(request: Request) {
  try {
    const body: HandoffRequest = await request.json();
    const { sessionId, roundType, transcript } = body;

    if (!sessionId || !roundType || !transcript) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, roundType, transcript" },
        { status: 400 }
      );
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[HANDOFF] 🔄 GENERATING HANDOFF FOR ${roundType.toUpperCase()} ROUND`);
    console.log(`${"=".repeat(60)}`);
    console.log(`[HANDOFF] Session: ${sessionId}`);
    console.log(`[HANDOFF] Transcript entries: ${transcript.length}`);

    // Find the interview
    let interview = getInterview(sessionId) || 
                    interviewsStore.find(i => i.id === sessionId) ||
                    mockInterviews.find(i => i.id === sessionId);

    if (!interview) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    // Find the job for requirements context
    const job = getJob(interview.jobId) || mockJobs.find(j => j.id === interview.jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: "Job not found for interview" },
        { status: 404 }
      );
    }

    // Get round duration
    const duration = roundType === "hr" ? job.interviewConfig.hrDuration :
                     roundType === "technical" ? job.interviewConfig.technicalDuration :
                     job.interviewConfig.codingDuration;

    // Generate handoff context using Grok 4.1
    const handoff = await generateRoundHandoff(
      roundType,
      transcript,
      duration,
      job.title,
      job.requirements
    );

    console.log(`[HANDOFF] ✅ HANDOFF GENERATED SUCCESSFULLY:`);
    console.log(`  📋 Topics discussed: ${handoff.topicsDiscussed.length} → ${handoff.topicsDiscussed.slice(0, 3).join(", ")}${handoff.topicsDiscussed.length > 3 ? "..." : ""}`);
    console.log(`  🎯 Claims to verify: ${handoff.candidateClaims.length}`);
    if (handoff.candidateClaims.length > 0) {
      console.log(`     Example: "${handoff.candidateClaims[0].claim.substring(0, 60)}..."`);
    }
    console.log(`  🔍 Areas to explore: ${handoff.areasToExplore.length}`);
    console.log(`  ✨ Positive signals: ${handoff.positiveSignals.length}`);
    console.log(`  💬 Discussion points: ${handoff.discussionPoints.length}`);
    console.log(`${"=".repeat(60)}\n`);

    // Update the interview with handoff data
    const interviewIndex = interviewsStore.findIndex(i => i.id === sessionId);
    if (interviewIndex !== -1) {
      const roundKey = roundType as keyof typeof interview.rounds;
      if (interview.rounds[roundKey]) {
        interviewsStore[interviewIndex].rounds[roundKey] = {
          ...interviewsStore[interviewIndex].rounds[roundKey],
          transcript,
          handoff: {
            topicsDiscussed: handoff.topicsDiscussed,
            candidateClaims: handoff.candidateClaims,
            areasToExplore: handoff.areasToExplore,
            positiveSignals: handoff.positiveSignals,
            discussionPoints: handoff.discussionPoints,
            completedAt: handoff.completedAt,
          },
          status: "completed",
        };
        console.log(`[Handoff API] Updated interview ${sessionId} with ${roundType} handoff`);
      }
    }

    return NextResponse.json({
      success: true,
      handoff: {
        topicsDiscussed: handoff.topicsDiscussed,
        candidateClaims: handoff.candidateClaims.length,
        areasToExplore: handoff.areasToExplore.length,
        positiveSignals: handoff.positiveSignals.length,
        discussionPoints: handoff.discussionPoints.length,
        completedAt: handoff.completedAt,
      },
      message: `Handoff generated for ${roundType} round. Context will be available for subsequent rounds.`,
    });
  } catch (error) {
    console.error("[Handoff API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate handoff", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve handoff data for a session
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId parameter" },
        { status: 400 }
      );
    }

    const interview = getInterview(sessionId) || 
                      interviewsStore.find(i => i.id === sessionId) ||
                      mockInterviews.find(i => i.id === sessionId);

    if (!interview) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    // Collect all handoff data
    const handoffs = {
      hr: interview.rounds?.hr?.handoff || null,
      technical: interview.rounds?.technical?.handoff || null,
      coding: interview.rounds?.coding?.handoff || null,
    };

    return NextResponse.json({
      sessionId,
      handoffs,
      completedRounds: Object.entries(handoffs)
        .filter(([_, h]) => h !== null)
        .map(([round]) => round),
    });
  } catch (error) {
    console.error("[Handoff API] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve handoffs" },
      { status: 500 }
    );
  }
}
