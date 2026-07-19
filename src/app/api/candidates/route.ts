/**
 * Candidates API
 * CRUD operations for candidate management
 */

import { NextResponse } from "next/server";
import { Candidate } from "@/lib/types";
import { candidatesStore, addCandidate, jobsStore } from "@/lib/store";

/**
 * GET /api/candidates
 * Get all candidates
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const status = searchParams.get("status");

  let filtered = candidatesStore;

  if (jobId) {
    filtered = filtered.filter((c) => c.jobId === jobId);
  }

  if (status) {
    filtered = filtered.filter((c) => c.status === status);
  }

  return NextResponse.json({
    candidates: filtered,
    total: filtered.length,
  });
}

/**
 * POST /api/candidates
 * Create a new candidate
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, jobId, resumeSummary } = body;

    if (!name || !email || !jobId) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, jobId" },
        { status: 400 }
      );
    }

    // Validate job exists
    const job = jobsStore.find((j) => j.id === jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check for duplicate email
    const existingCandidate = candidatesStore.find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    );
    if (existingCandidate) {
      return NextResponse.json(
        { error: "A candidate with this email already exists" },
        { status: 409 }
      );
    }

    const newCandidate: Candidate = {
      id: `cand-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      email,
      phone: phone || undefined,
      jobId,
      resumeSummary: resumeSummary || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    addCandidate(newCandidate);

    console.log(`[Candidates API] Created candidate: ${newCandidate.name} (${newCandidate.id})`);

    return NextResponse.json({
      success: true,
      candidate: newCandidate,
    });
  } catch (error) {
    console.error("[Candidates API] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    );
  }
}
