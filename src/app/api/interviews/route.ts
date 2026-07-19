/**
 * Interviews API — Firestore-backed
 * Create and list interview sessions (single source of truth)
 */

import { NextResponse } from "next/server";
import {
  createInterview,
  getInterviewsByCandidate,
  getInterviewsByRecruiter,
  getInterviewsByJob,
  getUserById,
  getJobById,
  adjustWallet,
} from "@/lib/firestore-service";

/**
 * GET /api/interviews
 * Query by candidateId, recruiterId, or jobId
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");
    const recruiterId = searchParams.get("recruiterId");
    const jobId = searchParams.get("jobId");

    let interviews: Awaited<ReturnType<typeof getInterviewsByCandidate>> = [];

    if (candidateId) {
      interviews = await getInterviewsByCandidate(candidateId);
    } else if (recruiterId) {
      interviews = await getInterviewsByRecruiter(recruiterId);
    } else if (jobId) {
      interviews = await getInterviewsByJob(jobId);
    }

    return NextResponse.json({ interviews, total: interviews.length });
  } catch (error) {
    console.error("[Interviews API] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}

/**
 * POST /api/interviews
 * Create a new interview session.
 *
 * Body for HIRING interview:
 *   { type: "hiring", candidateId, jobId, recruiterId, scheduledTime? }
 *
 * Body for MOCK interview:
 *   { type: "mock", candidateId, mockPackId, scheduledTime? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, candidateId, jobId, recruiterId, mockPackId, scheduledTime } = body;

    if (!type || !candidateId) {
      return NextResponse.json(
        { error: "Missing required fields: type, candidateId" },
        { status: 400 }
      );
    }

    if (type !== "hiring" && type !== "mock") {
      return NextResponse.json({ error: "type must be 'hiring' or 'mock'" }, { status: 400 });
    }

    // Validate candidate exists
    const candidate = await getUserById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // HIRING: validate job and charge recruiter
    if (type === "hiring") {
      if (!jobId || !recruiterId) {
        return NextResponse.json(
          { error: "Hiring interviews require jobId and recruiterId" },
          { status: 400 }
        );
      }

      const job = await getJobById(jobId);
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const recruiter = await getUserById(recruiterId);
      if (!recruiter) {
        return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
      }

      // Check wallet balance
      const cost = job.screeningCostPerCandidate;
      if (recruiter.walletBalance < cost) {
        return NextResponse.json(
          {
            error: "Insufficient wallet balance",
            required: cost,
            available: recruiter.walletBalance,
          },
          { status: 402 }
        );
      }

      // Deduct from recruiter wallet
      await adjustWallet(recruiterId, -cost);

      const interview = await createInterview({
        candidateId,
        type: "hiring",
        jobId,
        recruiterId,
        status: "scheduled",
        costToPlatform: 0,        // updated after call ends
        revenueCollected: cost,    // what the recruiter paid
        finalScore: 0,
        scheduledTime: scheduledTime ?? null,
      });

      console.log(`[Interviews API] Created hiring interview ${interview.id} (cost: ₹${cost})`);
      return NextResponse.json({ success: true, interview });
    }

    // MOCK: validate mock pack and charge candidate
    if (type === "mock") {
      if (!mockPackId) {
        return NextResponse.json(
          { error: "Mock interviews require mockPackId" },
          { status: 400 }
        );
      }

      // Import lazily to avoid circular deps
      const { getMockPackById } = await import("@/lib/firestore-service");
      const pack = await getMockPackById(mockPackId);
      if (!pack) {
        return NextResponse.json({ error: "Mock pack not found" }, { status: 404 });
      }

      if (!pack.isActive) {
        return NextResponse.json({ error: "Mock pack is not currently available" }, { status: 400 });
      }

      // Check candidate wallet
      if (candidate.walletBalance < pack.price) {
        return NextResponse.json(
          {
            error: "Insufficient wallet balance",
            required: pack.price,
            available: candidate.walletBalance,
          },
          { status: 402 }
        );
      }

      // Charge candidate
      await adjustWallet(candidateId, -pack.price);

      const interview = await createInterview({
        candidateId,
        type: "mock",
        mockPackId,
        status: "scheduled",
        costToPlatform: 0,
        revenueCollected: pack.price,
        finalScore: 0,
        scheduledTime: scheduledTime ?? null,
      });

      console.log(`[Interviews API] Created mock interview ${interview.id} (revenue: ₹${pack.price})`);
      return NextResponse.json({ success: true, interview });
    }
  } catch (error) {
    console.error("[Interviews API] Create error:", error);
    return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
  }
}
