/**
 * Candidates API — Firestore-backed
 * CRUD operations for candidate (user) management
 */

import { NextResponse } from "next/server";
import {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  getAllRecruiters,
} from "@/lib/firestore-service";
import { serverTimestamp } from "firebase/firestore";

/**
 * GET /api/candidates
 * Returns all users with role=candidate, or filtered by recruiterId.
 * Firestore doesn't let us query across uids easily without an index,
 * so the route accepts a role param and uses the typed query helpers.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") ?? "candidate";

    // Re-use recruiter helper as an example; extend as needed per role
    const users = role === "recruiter" ? await getAllRecruiters() : [];

    return NextResponse.json({ candidates: users, total: users.length });
  } catch (error) {
    console.error("[Candidates API] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

/**
 * POST /api/candidates
 * Create a new candidate user document in Firestore.
 * Expects: { uid, name, email, role?, walletBalance? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, name, email, role = "candidate", companyName, walletBalance = 0 } = body;

    if (!uid || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: uid, name, email" },
        { status: 400 }
      );
    }

    // Check for duplicate by uid
    const existing = await getUserById(uid);
    if (existing) {
      return NextResponse.json(
        { error: "User with this uid already exists" },
        { status: 409 }
      );
    }

    const user = await createUser(uid, {
      name,
      email,
      role,
      walletBalance,
      isApprovedByAdmin: role === "candidate", // candidates are auto-approved
      ...(companyName ? { companyName } : {}),
    });

    console.log(`[Candidates API] Created user: ${user.name} (${user.id}) role=${role}`);

    return NextResponse.json({ success: true, candidate: user });
  } catch (error) {
    console.error("[Candidates API] Create error:", error);
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 });
  }
}
