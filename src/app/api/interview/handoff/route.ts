/**
 * Round Handoff Generation API — Firestore-backed
 *
 * Called after each interview round completes to:
 * 1. Generate structured handoff context from the transcript
 * 2. Persist it into the Firestore interview document
 * 3. Enable cross-round context for subsequent interviewers
 */

import { NextResponse } from "next/server";
import { generateRoundHandoff } from "@/lib/round-handoff";
import { getInterviewById, getJobById, getMockPackById, updateInterview } from "@/lib/firestore-service";
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

    // Find the interview in Firestore
    const interview = await getInterviewById(sessionId);

    if (!interview) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    // Resolve job title + requirements for context
    let jobTitle = "Software Engineer";
    let requirements: string[] = [];

    if (interview.type === "hiring" && interview.jobId) {
      const job = await getJobById(interview.jobId);
      if (job) {
        jobTitle = job.title;
        // requirements not stored separately; derive from description if needed
      }
    } else if (interview.type === "mock" && interview.mockPackId) {
      const pack = await getMockPackById(interview.mockPackId);
      if (pack) {
        jobTitle = pack.title;
      }
    }

    const duration = 15; // default; improve by storing round duration in interview doc

    // Generate handoff context using Grok
    const handoff = await generateRoundHandoff(roundType, transcript, duration, jobTitle, requirements);

    console.log(`[HANDOFF] ✅ HANDOFF GENERATED SUCCESSFULLY:`);
    console.log(`  📋 Topics discussed: ${handoff.topicsDiscussed.length}`);
    console.log(`  🎯 Claims to verify: ${handoff.candidateClaims.length}`);
    console.log(`  🔍 Areas to explore: ${handoff.areasToExplore.length}`);
    console.log(`  ✨ Positive signals: ${handoff.positiveSignals.length}`);
    console.log(`${"=".repeat(60)}\n`);

    // Persist handoff into Firestore interview doc under `{roundType}Handoff`
    const handoffPayload = {
      topicsDiscussed: handoff.topicsDiscussed,
      candidateClaims: handoff.candidateClaims,
      areasToExplore: handoff.areasToExplore,
      positiveSignals: handoff.positiveSignals,
      discussionPoints: handoff.discussionPoints,
      completedAt: handoff.completedAt,
    };

    await updateInterview(sessionId, {
      [`${roundType}Handoff`]: handoffPayload,
      [`${roundType}Status`]: "completed",
    } as never);

    console.log(`[Handoff API] Updated interview ${sessionId} with ${roundType} handoff in Firestore`);

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
 * GET /api/interview/handoff?sessionId=xxx
 * Retrieve stored handoff data for all rounds of a session
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId parameter" }, { status: 400 });
    }

    const interview = await getInterviewById(sessionId);

    if (!interview) {
      return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
    }

    const interviewAny = interview as unknown as Record<string, unknown>;

    const handoffs = {
      hr: interviewAny["hrHandoff"] ?? null,
      technical: interviewAny["technicalHandoff"] ?? null,
      coding: interviewAny["codingHandoff"] ?? null,
    };

    return NextResponse.json({
      sessionId,
      handoffs,
      completedRounds: Object.entries(handoffs)
        .filter(([, h]) => h !== null)
        .map(([round]) => round),
    });
  } catch (error) {
    console.error("[Handoff API] GET Error:", error);
    return NextResponse.json({ error: "Failed to retrieve handoffs" }, { status: 500 });
  }
}
