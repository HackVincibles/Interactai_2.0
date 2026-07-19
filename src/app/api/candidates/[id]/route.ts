/**
 * Single Candidate API
 * Get, update, delete operations for a specific candidate
 */

import { NextResponse } from "next/server";
import { candidates as mockCandidates } from "@/lib/mock-data";
import { Candidate } from "@/lib/types";

// In-memory store (shared with main route in production via database)
// For demo, we re-import mock data
let candidatesStore: Candidate[] = [...mockCandidates];

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/candidates/[id]
 * Get a single candidate by ID
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const candidate = candidatesStore.find((c) => c.id === id);

  if (!candidate) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ candidate });
}

/**
 * PATCH /api/candidates/[id]
 * Update a candidate
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const index = candidatesStore.findIndex((c) => c.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedFields = ["name", "email", "phone", "jobId", "resumeSummary", "status", "notes"];
    const updates: Partial<Candidate> = {};
    
    for (const field of allowedFields) {
      if (field in body) {
        (updates as Record<string, unknown>)[field] = body[field];
      }
    }

    candidatesStore[index] = { ...candidatesStore[index], ...updates };

    return NextResponse.json({
      success: true,
      candidate: candidatesStore[index],
    });
  } catch (error) {
    console.error("[Candidates API] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update candidate" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/candidates/[id]
 * Delete a candidate
 */
export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const index = candidatesStore.findIndex((c) => c.id === id);

  if (index === -1) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 }
    );
  }

  candidatesStore.splice(index, 1);

  return NextResponse.json({
    success: true,
    message: "Candidate deleted",
  });
}
