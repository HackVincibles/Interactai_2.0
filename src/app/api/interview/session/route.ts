/**
 * Interview Session API Route — Firestore-backed
 * Creates ephemeral tokens for XAI voice sessions with custom prompts.
 *
 * CROSS-ROUND CONTEXT:
 * This API fetches handoff data from previous rounds to provide
 * context to subsequent interviewers, enabling:
 * - Natural conversation continuity
 * - Verification of claims made in earlier rounds
 * - Building on previous discussions
 */

import { NextResponse } from "next/server";
import {
  getInterviewPrompt,
  getVoiceForRound,
  getTemperatureForRound,
  SESSION_CONFIG,
  type InterviewRoundType,
  type InterviewContext,
} from "@/lib/interview-prompts";
import { getInterviewById, getUserById, getJobById, getMockPackById } from "@/lib/firestore-service";
import { formatHandoffForPrompt, type RoundHandoff } from "@/lib/round-handoff";

// XAI API configuration
const XAI_API_KEY = process.env.XAI_API_KEY || "";
const SESSION_REQUEST_URL = "https://api.x.ai/v1/realtime/client_secrets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roundType,
      sessionId,
      candidateId,
      // Client can pass these as a fallback when Firestore doc was just created
      // and the read-after-write race hasn't resolved yet.
      candidateData,
      jobData,
    } = body as {
      roundType: string;
      sessionId: string;
      candidateId?: string;
      candidateData?: {
        id: string;
        name: string;
        email: string;
        jobId?: string;
        mockPackId?: string;
        resumeSummary?: string;
      };
      jobData?: {
        id: string;
        title: string;
        company: string;
        description?: string;
        requirements: string[];
        interviewConfig: {
          hrDuration: number;
          technicalDuration: number;
          codingDuration: number;
          codingEnabled?: boolean;
        };
      };
    };

    if (!roundType || !sessionId) {
      return NextResponse.json(
        { error: "Missing roundType or sessionId" },
        { status: 400 }
      );
    }

    if (!XAI_API_KEY) {
      return NextResponse.json(
        { error: "XAI_API_KEY not configured. Please add it to .env.local" },
        { status: 500 }
      );
    }

    // ── Fetch interview from Firestore ────────────────────────────
    const interview = await getInterviewById(sessionId);

    if (!interview) {
      console.error(`[API] Interview not found in Firestore: ${sessionId}`);
      return NextResponse.json(
        { error: "Interview session not found. Create it via POST /api/interviews first." },
        { status: 404 }
      );
    }

    // ── Resolve candidate ─────────────────────────────────────────
    let candidate = await getUserById(interview.candidateId);

    if (!candidate && candidateData) {
      // Fallback: client-provided data for the brief window after creation
      console.warn(`[API] Candidate not found in Firestore, using client-provided data.`);
      candidate = {
        id: candidateData.id,
        name: candidateData.name,
        email: candidateData.email,
        role: "candidate",
        walletBalance: 0,
        isApprovedByAdmin: true,
        createdAt: null,
      } as unknown as typeof candidate;
    }

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found. Ensure the user document exists in Firestore." },
        { status: 404 }
      );
    }

    // ── Resolve job / mock pack ───────────────────────────────────
    // Build a normalized "job-like" context object for the prompt builder.
    let jobContext: {
      title: string;
      company: string;
      description: string;
      requirements: string[];
      interviewConfig: { hrDuration: number; technicalDuration: number; codingDuration: number; codingEnabled: boolean };
    } | null = null;

    if (interview.type === "hiring" && interview.jobId) {
      const job = await getJobById(interview.jobId);
      if (job) {
        jobContext = {
          title: job.title,
          company: "Hiring Company", // recruiters don't expose company name here
          description: job.description,
          requirements: [], // stored in aiPersonaPrompt; requirements extracted if needed
          interviewConfig: { hrDuration: 15, technicalDuration: 20, codingDuration: 20, codingEnabled: true },
        };
      }
    } else if (interview.type === "mock" && interview.mockPackId) {
      const pack = await getMockPackById(interview.mockPackId);
      if (pack) {
        jobContext = {
          title: pack.title,
          company: pack.companyTheme,
          description: pack.aiPersonaPrompt,
          requirements: [],
          interviewConfig: {
            hrDuration: pack.durationMinutes,
            technicalDuration: pack.durationMinutes,
            codingDuration: pack.durationMinutes,
            codingEnabled: false,
          },
        };
      }
    }

    // Final fallback: client-provided job data
    if (!jobContext && jobData) {
      console.warn(`[API] Job not found in Firestore, using client-provided data.`);
      jobContext = {
        title: jobData.title,
        company: jobData.company,
        description: jobData.description || "",
        requirements: jobData.requirements,
        interviewConfig: {
          hrDuration: jobData.interviewConfig.hrDuration,
          technicalDuration: jobData.interviewConfig.technicalDuration,
          codingDuration: jobData.interviewConfig.codingDuration,
          codingEnabled: jobData.interviewConfig.codingEnabled ?? false,
        },
      };
    }

    if (!jobContext) {
      return NextResponse.json(
        { error: "Could not resolve job or mock pack for this interview." },
        { status: 404 }
      );
    }

    // ── Cross-round handoff context ───────────────────────────────
    let previousRoundContext: string | undefined;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[HANDOFF] Starting ${roundType.toUpperCase()} round for session ${sessionId}`);
    console.log(`${"=".repeat(60)}`);

    // Handoff data is stored inside the interview doc as nested fields.
    // The interview doc is intentionally flat for the Phase 1 schema;
    // handoff data will be persisted by the analyze/summary routes.
    const interviewAny = interview as unknown as Record<string, unknown>;

    if (roundType === "technical" || roundType === "coding") {
      const handoffs: RoundHandoff[] = [];

      if (interviewAny["hrHandoff"]) {
        handoffs.push({ ...(interviewAny["hrHandoff"] as object), roundType: "hr" } as RoundHandoff);
        console.log(`[HANDOFF] ✅ Found HR round handoff`);
      } else {
        console.log(`[HANDOFF] ⚠️ No HR round handoff found`);
      }

      if (roundType === "coding" && interviewAny["technicalHandoff"]) {
        handoffs.push({ ...(interviewAny["technicalHandoff"] as object), roundType: "technical" } as RoundHandoff);
        console.log(`[HANDOFF] ✅ Found Technical round handoff`);
      }

      if (handoffs.length > 0) {
        previousRoundContext = formatHandoffForPrompt(handoffs, roundType as "technical" | "coding");
        console.log(`[HANDOFF] ✅ Cross-round context generated (${handoffs.length} previous round(s))`);
      } else {
        console.log(`[HANDOFF] ❌ No previous round context available`);
      }
    } else {
      console.log(`[HANDOFF] ℹ️ HR round — no previous context needed`);
    }
    console.log(`${"=".repeat(60)}\n`);

    // ── Build prompt context ──────────────────────────────────────
    const context: InterviewContext = {
      candidateName: candidate.name,
      jobTitle: jobContext.title,
      company: jobContext.company,
      requirements: jobContext.requirements,
      duration: getDurationForRound(roundType, jobContext.interviewConfig),
      resumeSummary: (candidateData?.resumeSummary) ?? undefined,
      previousRoundContext,
    };

    const instructions = getInterviewPrompt(roundType as InterviewRoundType, context);
    const voice = getVoiceForRound(roundType as InterviewRoundType);
    const temperature = getTemperatureForRound(roundType as InterviewRoundType);

    console.log(`[API] Creating session for ${roundType} interview`);
    console.log(`[API] Candidate: ${candidate.name}`);
    console.log(`[API] Role: ${jobContext.title} at ${jobContext.company}`);
    console.log(`[API] 🎙️  Voice: ${voice}`);
    console.log(`[API] 🌡️  Temperature: ${temperature}`);

    // ── Request ephemeral token from XAI ─────────────────────────
    const response = await fetch(SESSION_REQUEST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { seconds: 600 }, // 10-minute token
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] XAI token error: ${response.status} ${errorText}`);
      return NextResponse.json(
        { error: "Failed to create session", details: errorText },
        { status: response.status }
      );
    }

    const data = (await response.json()) as { value: string; expires_at: number };
    console.log(`[API] Session created successfully, expires: ${new Date(data.expires_at * 1000).toISOString()}`);

    return NextResponse.json({
      client_secret: {
        value: data.value,
        expires_at: data.expires_at,
      },
      voice,
      instructions,
      sessionConfig: {
        temperature,
        turnDetection: SESSION_CONFIG.turnDetection,
        modalities: SESSION_CONFIG.modalities,
        inputAudioTranscription: SESSION_CONFIG.inputAudioTranscription,
        maxResponseOutputTokens: SESSION_CONFIG.maxResponseOutputTokens,
      },
    });
  } catch (error) {
    console.error("[API] Session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

function getDurationForRound(
  roundType: string,
  config: { hrDuration: number; technicalDuration: number; codingDuration: number }
): number {
  switch (roundType) {
    case "hr":
      return config.hrDuration;
    case "technical":
      return config.technicalDuration;
    case "coding":
      return config.codingDuration;
    default:
      return 15;
  }
}
