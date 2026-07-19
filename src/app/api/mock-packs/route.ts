/**
 * Mock Packs API — Firestore-backed (B2C Revenue Stream)
 * Admin creates and manages mock interview packs.
 * Candidates browse and purchase them.
 */

import { NextResponse } from "next/server";
import {
  createMockPack,
  getActiveMockPacks,
  getUserById,
} from "@/lib/firestore-service";

/**
 * GET /api/mock-packs
 * Returns all active mock packs (public endpoint for candidates to browse).
 */
export async function GET() {
  try {
    const packs = await getActiveMockPacks();
    return NextResponse.json({ packs, total: packs.length });
  } catch (error) {
    console.error("[Mock Packs API] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch mock packs" }, { status: 500 });
  }
}

/**
 * POST /api/mock-packs
 * Admin-only: create a new mock pack.
 *
 * Body: { adminUid, title, companyTheme, difficulty, price, durationMinutes, aiPersonaPrompt }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      adminUid,
      title,
      companyTheme,
      difficulty = "Medium",
      price,
      durationMinutes = 15,
      aiPersonaPrompt,
    } = body;

    if (!adminUid || !title || !price || !aiPersonaPrompt) {
      return NextResponse.json(
        { error: "Missing required fields: adminUid, title, price, aiPersonaPrompt" },
        { status: 400 }
      );
    }

    const admin = await getUserById(adminUid);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create mock packs" },
        { status: 403 }
      );
    }

    const pack = await createMockPack({
      title,
      companyTheme: companyTheme || title,
      difficulty,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      aiPersonaPrompt,
      isActive: true,
      createdBy: adminUid,
    });

    console.log(`[Mock Packs API] Created pack "${title}" at ₹${price}`);
    return NextResponse.json({ success: true, pack });
  } catch (error) {
    console.error("[Mock Packs API] Create error:", error);
    return NextResponse.json({ error: "Failed to create mock pack" }, { status: 500 });
  }
}
