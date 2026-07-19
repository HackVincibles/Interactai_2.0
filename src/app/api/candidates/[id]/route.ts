/**
 * Single Candidate/User API — Firestore-backed
 * GET, PATCH, DELETE for a specific user document
 */

import { NextResponse } from "next/server";
import { getUserById, updateUser } from "@/lib/firestore-service";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/candidates/[id]
 * Fetch a single user by uid
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  const user = await getUserById(id);
  if (!user) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  return NextResponse.json({ candidate: user });
}

/**
 * PATCH /api/candidates/[id]
 * Update allowed fields on a user document
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getUserById(id);
    if (!existing) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const allowedFields = ["name", "email", "phone", "resumeSummary", "status", "notes", "walletBalance", "isApprovedByAdmin", "companyName"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    await updateUser(id, updates);

    return NextResponse.json({ success: true, candidate: { ...existing, ...updates } });
  } catch (error) {
    console.error("[Candidates API] Update error:", error);
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}

/**
 * DELETE /api/candidates/[id]
 * Hard-delete a user document (admin only — enforce auth checks in middleware)
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  const existing = await getUserById(id);
  if (!existing) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  await deleteDoc(doc(db, "users", id));

  return NextResponse.json({ success: true, message: "User deleted" });
}
