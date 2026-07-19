/**
 * Interview Summary API Route — Firestore-backed
 * Returns high-level interview metadata for a given session ID.
 * Round-level detail (scores, handoffs) are accessed via /api/interview/handoff.
 */

import { NextResponse } from "next/server";
import { getInterviewById } from "@/lib/firestore-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const interview = await getInterviewById(sessionId);

    if (!interview) {
      return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
    }

    // Count rounds by inspecting dynamically stored status fields
    const interviewAny = interview as unknown as Record<string, unknown>;
    const completedRounds = (["hr", "technical", "coding"] as const).filter(
      (r) => interviewAny[`${r}Status`] === "completed"
    );

    return NextResponse.json({
      interview,
      overallScore: interview.finalScore,
      roundsCompleted: completedRounds.length,
      // mock interviews have 1 "round"; hiring interviews have 2 (hr + technical)
      totalRounds: interview.type === "mock" ? 1 : 2,
      // These are enriched by the client via the /api/candidates/[id] endpoint
      candidateName: null,
      candidateEmail: null,
      candidatePhone: null,
      jobTitle: null,
      jobCompany: null,
    });
  } catch (error) {
    console.error("[API] Summary error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
