/**
 * Post-Interview Analysis API
 * Analyzes the transcript and generates a structured evaluation
 */

import { NextResponse } from "next/server";
import type { TranscriptEntry, CompetencyScores, AIInsights } from "@/lib/types";

const XAI_API_KEY = process.env.XAI_API_KEY || "";
const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";

interface AnalysisRequest {
  roundType: string;
  jobTitle: string;
  company: string;
  transcript: TranscriptEntry[];
}

interface AnalysisResponse {
  score: number;
  competencies: CompetencyScores;
  insights: AIInsights;
  summary: string;
  highlights: string[];
  concerns: string[];
}

export async function POST(request: Request) {
  try {
    const body: AnalysisRequest = await request.json();
    const { roundType, jobTitle, company, transcript } = body;

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    if (!XAI_API_KEY) {
      return NextResponse.json(
        { error: "XAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Format transcript for analysis
    const transcriptText = transcript
      .map((entry) => `${entry.role === "assistant" ? "Interviewer" : "Candidate"}: ${entry.content}`)
      .join("\n");

    const analysisPrompt = getAnalysisPrompt(roundType, jobTitle, company, transcriptText);

    console.log(`[Analysis API] Analyzing ${roundType} interview transcript (${transcript.length} entries)`);

    const response = await fetch(XAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
        messages: [
          {
            role: "system",
            content: "You are an expert HR analyst who evaluates interview transcripts. Provide structured, objective assessments based on evidence from the conversation. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        temperature: 0.3, // Lower temperature for consistent analysis
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Analysis API] XAI error: ${response.status} ${errorText}`);
      return NextResponse.json(
        { error: "Analysis failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;

    if (!analysisText) {
      return NextResponse.json(
        { error: "No analysis generated" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const analysis: AnalysisResponse = JSON.parse(analysisText);
    
    console.log(`[Analysis API] Analysis complete - Score: ${analysis.score}`);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[Analysis API] Error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

function getAnalysisPrompt(roundType: string, jobTitle: string, company: string, transcript: string): string {
  return `Analyze this ${roundType.toUpperCase()} interview transcript for a ${jobTitle} position at ${company}.

## TRANSCRIPT
${transcript}

## ANALYSIS REQUIRED

Evaluate the candidate based on the conversation and provide a JSON response with this exact structure:

{
  "score": <number 0-100, overall interview score>,
  "competencies": {
    "technicalProficiency": <number 0-100>,
    "problemSolving": <number 0-100>,
    "communication": <number 0-100>,
    "cultureFit": <number 0-100>
  },
  "insights": {
    "strengths": [<array of 2-4 specific strengths observed>],
    "areasForGrowth": [<array of 1-3 areas for improvement>],
    "redFlags": [<array of any concerns, empty if none>],
    "recommendation": <"strong-hire" | "hire" | "maybe" | "no-hire">,
    "confidence": <number 0-100, confidence in this assessment>
  },
  "summary": "<2-3 sentence summary of the candidate's performance>",
  "highlights": [<array of 2-3 notable positive quotes from candidate>],
  "concerns": [<array of specific concerns if any, empty if none>]
}

## SCORING GUIDELINES

### Score Ranges:
- 85-100: Exceptional candidate, clear hire
- 70-84: Strong candidate, likely hire
- 55-69: Mixed signals, needs more evaluation
- 40-54: Below expectations, likely no-hire
- 0-39: Clear no-hire (unprofessional, unqualified, or disengaged)

### Red Flags to Note:
- Unprofessional language or behavior
- Inability to provide specific examples
- Negative attitude about all past experiences
- Lack of interest in the actual role
- Inconsistencies in their story
- Refusal to answer reasonable questions

### Communication Score Factors:
- Clarity and conciseness
- Professionalism
- Active listening
- Appropriate responses

### Culture Fit Factors:
- Attitude and demeanor
- Interest in the company/role
- Values alignment
- Collaborative vs. combative

Be objective and base your assessment on evidence from the transcript. If the interview was cut short due to candidate behavior, reflect that in your scores.`;
}
