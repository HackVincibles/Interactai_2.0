/**
 * Jobs API — Firestore-backed (B2B Revenue Stream)
 * Recruiters create and manage job postings.
 */

import { NextResponse } from "next/server";
import {
  createJob,
  getOpenJobs,
  getJobsByRecruiter,
  getUserById,
} from "@/lib/firestore-service";

/**
 * GET /api/jobs
 * Returns open jobs, or jobs for a specific recruiter.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recruiterId = searchParams.get("recruiterId");

    const jobs = recruiterId
      ? await getJobsByRecruiter(recruiterId)
      : await getOpenJobs();

    return NextResponse.json({ jobs, total: jobs.length });
  } catch (error) {
    console.error("[Jobs API] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

/**
 * POST /api/jobs
 * Create a new job posting (recruiter must be approved).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      recruiterId,
      title,
      description,
      aiPersonaPrompt,
      screeningCostPerCandidate = 25,
      autoRejectScore = 60,
    } = body;

    if (!recruiterId || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields: recruiterId, title, description" },
        { status: 400 }
      );
    }

    const recruiter = await getUserById(recruiterId);
    if (!recruiter) {
      return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
    }

    if (recruiter.role !== "recruiter") {
      return NextResponse.json({ error: "Only recruiters can create jobs" }, { status: 403 });
    }

    if (!recruiter.isApprovedByAdmin) {
      return NextResponse.json(
        { error: "Recruiter account is pending admin approval" },
        { status: 403 }
      );
    }

    const job = await createJob({
      recruiterId,
      title,
      description,
      aiPersonaPrompt: aiPersonaPrompt || `You are a professional interviewer for the ${title} role. Ask relevant technical and behavioral questions.`,
      screeningCostPerCandidate,
      autoRejectScore,
      status: "open",
    });

    console.log(`[Jobs API] Created job "${title}" by recruiter ${recruiterId}`);
    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("[Jobs API] Create error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
