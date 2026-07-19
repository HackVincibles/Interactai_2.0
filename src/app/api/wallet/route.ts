/**
 * Wallet API
 * Top-up a user's wallet balance (simulates a payment gateway callback).
 * In production, replace the body of POST with a verified Razorpay/Stripe webhook.
 */

import { NextResponse } from "next/server";
import { getUserById, adjustWallet } from "@/lib/firestore-service";

/**
 * GET /api/wallet?uid=xxx
 * Returns current wallet balance for a user.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  const user = await getUserById(uid);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ uid, walletBalance: user.walletBalance });
}

/**
 * POST /api/wallet
 * Add credits to a user's wallet.
 *
 * Body: { uid, amount, paymentRef? }
 * amount is in Rupees (positive to credit, negative to debit).
 *
 * TODO: Replace with verified Razorpay webhook signature check.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, amount, paymentRef } = body;

    if (!uid || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: uid, amount" },
        { status: 400 }
      );
    }

    const user = await getUserById(uid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await adjustWallet(uid, amount);

    console.log(
      `[Wallet API] ₹${amount} ${amount >= 0 ? "credited to" : "debited from"} ${user.name} (${uid}) | ref: ${paymentRef ?? "N/A"}`
    );

    return NextResponse.json({
      success: true,
      newBalance: user.walletBalance + amount,
    });
  } catch (error) {
    console.error("[Wallet API] Error:", error);
    return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 });
  }
}
