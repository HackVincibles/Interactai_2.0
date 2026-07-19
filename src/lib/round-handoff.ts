/**
 * Round Handoff System
 * 
 * Manages the flow of context between interview rounds.
 * Based on industry best practices:
 * - Pass factual observations, not judgments
 * - Enable natural conversation continuity
 * - Avoid bias by not sharing scores
 * - Allow each round to assess independently
 * 
 * Research sources:
 * - Google's structured hiring guide
 * - FAANG interview processes
 * - Holloway technical recruiting guide
 */

import type { TranscriptEntry, RoundResult, AIInsights, CompetencyScores } from "./types";

/**
 * Information that can be safely passed between rounds
 * Designed to inform without biasing the next interviewer
 */
export interface RoundHandoff {
  // Factual information (what was discussed)
  topicsDiscussed: string[];
  
  // Claims the candidate made that can be verified/explored
  candidateClaims: CandidateClaim[];
  
  // Areas that need deeper exploration (neutral framing)
  areasToExplore: AreaToExplore[];
  
  // Positive signals to build rapport (reference in conversation)
  positiveSignals: string[];
  
  // Specific discussion points for natural continuity
  discussionPoints: DiscussionPoint[];
  
  // Round metadata
  roundType: "hr" | "technical" | "coding";
  duration: number; // minutes
  completedAt: string;
}

export interface CandidateClaim {
  // What the candidate claimed
  claim: string;
  // Context in which they made the claim
  context: string;
  // Technologies/skills mentioned
  technologies?: string[];
  // Can be verified in technical round
  verifiable: boolean;
}

export interface AreaToExplore {
  // Topic that needs more depth
  topic: string;
  // Why this needs exploration (neutral, not negative)
  reason: "incomplete_answer" | "mentioned_but_not_elaborated" | "relevant_to_role" | "follow_up_needed";
  // Suggested question angle (Socratic, not accusatory)
  suggestedApproach?: string;
}

export interface DiscussionPoint {
  // What was discussed
  topic: string;
  // Candidate's response (summary)
  candidateResponse: string;
  // Good for natural reference in next round
  referencePhrase?: string; // e.g., "You mentioned earlier that you worked on..."
}

/**
 * Full interview pipeline context
 * Accumulated across all rounds
 */
export interface PipelineContext {
  candidateId: string;
  sessionId: string;
  
  // Handoffs from completed rounds
  hrHandoff?: RoundHandoff;
  technicalHandoff?: RoundHandoff;
  
  // Running summary (updated after each round)
  cumulativeSummary: string;
  
  // Key claims to verify (accumulated)
  pendingVerifications: CandidateClaim[];
}

/**
 * Generate handoff context from a completed round's transcript
 * Uses Grok to extract structured insights
 */
export async function generateRoundHandoff(
  roundType: "hr" | "technical" | "coding",
  transcript: TranscriptEntry[],
  duration: number,
  jobTitle: string,
  requirements: string[]
): Promise<RoundHandoff> {
  const XAI_API_KEY = process.env.XAI_API_KEY || "";
  
  if (!XAI_API_KEY || transcript.length === 0) {
    // Return empty handoff if no API key or transcript
    return getEmptyHandoff(roundType, duration);
  }

  const transcriptText = transcript
    .map((entry) => `${entry.role === "assistant" ? "Interviewer" : "Candidate"}: ${entry.content}`)
    .join("\n");

  const prompt = buildHandoffPrompt(roundType, transcriptText, jobTitle, requirements);

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Use Grok 4.1 reasoning for better extraction
        model: "grok-4-1",
        messages: [
          {
            role: "system",
            content: `You are an expert interview analyst. Extract structured insights from interview transcripts to help subsequent interviewers have informed, natural conversations.

CRITICAL RULES:
1. DO NOT include scores, ratings, or hire/no-hire judgments
2. DO NOT label anything as "red flag" or "concern"
3. Frame everything neutrally - areas to explore, not problems
4. Focus on factual observations, not interpretations
5. Enable natural conversation continuity between rounds

Your goal is to help the next interviewer:
- Reference previous discussions naturally
- Explore topics that need more depth
- Verify technical claims appropriately
- Build rapport by acknowledging what was discussed`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error(`[Handoff] API error: ${response.status}`);
      return getEmptyHandoff(roundType, duration);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return getEmptyHandoff(roundType, duration);
    }

    const parsed = JSON.parse(content);
    
    return {
      topicsDiscussed: parsed.topicsDiscussed || [],
      candidateClaims: parsed.candidateClaims || [],
      areasToExplore: parsed.areasToExplore || [],
      positiveSignals: parsed.positiveSignals || [],
      discussionPoints: parsed.discussionPoints || [],
      roundType,
      duration,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Handoff] Error generating handoff:", error);
    return getEmptyHandoff(roundType, duration);
  }
}

function buildHandoffPrompt(
  roundType: string,
  transcript: string,
  jobTitle: string,
  requirements: string[]
): string {
  return `Analyze this ${roundType.toUpperCase()} interview transcript for a ${jobTitle} position.

TRANSCRIPT:
${transcript}

ROLE REQUIREMENTS:
${requirements.join(", ")}

Extract information for the NEXT interviewer. Output JSON:

{
  "topicsDiscussed": [
    // List of main topics covered (e.g., "career motivation", "team collaboration", "Python experience")
  ],
  
  "candidateClaims": [
    {
      "claim": "Led a team of 5 engineers on the authentication project",
      "context": "When discussing their previous role at TechCorp",
      "technologies": ["OAuth", "Redis", "Node.js"],
      "verifiable": true
    }
    // Include claims about experience, skills, achievements that can be explored/verified
  ],
  
  "areasToExplore": [
    {
      "topic": "Microservices architecture experience",
      "reason": "mentioned_but_not_elaborated",
      "suggestedApproach": "Ask them to walk through a specific microservices project they worked on"
    }
    // Topics that need more depth - frame neutrally, not as concerns
  ],
  
  "positiveSignals": [
    // Things that went well, good for building rapport
    // e.g., "Showed genuine enthusiasm about the company's mission"
    // e.g., "Gave specific examples when discussing team collaboration"
  ],
  
  "discussionPoints": [
    {
      "topic": "Previous role at TechCorp",
      "candidateResponse": "Spent 3 years building the user auth system, scaled to 2M users",
      "referencePhrase": "You mentioned earlier that you worked on the auth system at TechCorp..."
    }
    // Key points that can be naturally referenced in the next round
  ]
}

Remember:
- NO scores or judgments
- Neutral framing only
- Enable natural conversation flow
- Help next interviewer be informed, not biased`;
}

function getEmptyHandoff(roundType: "hr" | "technical" | "coding", duration: number): RoundHandoff {
  return {
    topicsDiscussed: [],
    candidateClaims: [],
    areasToExplore: [],
    positiveSignals: [],
    discussionPoints: [],
    roundType,
    duration,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Format handoff context for injection into interviewer prompt
 * Creates natural, conversational context
 */
export function formatHandoffForPrompt(
  handoffs: RoundHandoff[],
  currentRound: "technical" | "coding"
): string {
  if (handoffs.length === 0) {
    return "";
  }

  let context = `\n## CONTEXT FROM PREVIOUS ROUND(S)\n\n`;
  context += `The candidate has already completed ${handoffs.length} interview round(s). Here's what was discussed:\n\n`;

  for (const handoff of handoffs) {
    const roundLabel = handoff.roundType === "hr" ? "HR Screening" : 
                       handoff.roundType === "technical" ? "Technical Interview" : "Coding Round";
    
    context += `### ${roundLabel} (${handoff.duration} minutes)\n\n`;

    // Topics covered
    if (handoff.topicsDiscussed.length > 0) {
      context += `**Topics Discussed:** ${handoff.topicsDiscussed.join(", ")}\n\n`;
    }

    // Discussion points for natural reference
    if (handoff.discussionPoints.length > 0) {
      context += `**Key Discussion Points (use these to build rapport):**\n`;
      for (const point of handoff.discussionPoints.slice(0, 3)) {
        context += `- ${point.referencePhrase || `They discussed ${point.topic}`}\n`;
        context += `  → They said: "${point.candidateResponse}"\n`;
      }
      context += "\n";
    }

    // Claims to verify (for technical round)
    if (currentRound === "technical" && handoff.candidateClaims.length > 0) {
      context += `**Claims to Explore (verify through discussion, not interrogation):**\n`;
      for (const claim of handoff.candidateClaims.filter(c => c.verifiable).slice(0, 4)) {
        context += `- "${claim.claim}"\n`;
        if (claim.technologies?.length) {
          context += `  → Technologies mentioned: ${claim.technologies.join(", ")}\n`;
        }
      }
      context += "\n";
    }

    // Areas to explore
    if (handoff.areasToExplore.length > 0) {
      context += `**Areas Worth Exploring Further:**\n`;
      for (const area of handoff.areasToExplore.slice(0, 3)) {
        context += `- ${area.topic}`;
        if (area.suggestedApproach) {
          context += ` → ${area.suggestedApproach}`;
        }
        context += "\n";
      }
      context += "\n";
    }

    // Positive signals
    if (handoff.positiveSignals.length > 0) {
      context += `**Positive Signals (acknowledge these naturally):**\n`;
      for (const signal of handoff.positiveSignals.slice(0, 3)) {
        context += `- ${signal}\n`;
      }
      context += "\n";
    }
  }

  context += `**HOW TO USE THIS CONTEXT:**
- Reference previous discussions naturally: "I heard you worked on X, let's dig into that..."
- Don't repeat questions already asked
- Build on what was discussed, don't start from scratch
- Verify claims through technical discussion, not interrogation
- Use positive signals to build rapport
- This information is for context only - form your own assessment independently

`;

  return context;
}

/**
 * Generate cumulative summary after each round
 * Used for final hiring committee review
 */
export function generateCumulativeSummary(handoffs: RoundHandoff[]): string {
  if (handoffs.length === 0) {
    return "No interviews completed yet.";
  }

  const allTopics = [...new Set(handoffs.flatMap(h => h.topicsDiscussed))];
  const allClaims = handoffs.flatMap(h => h.candidateClaims);
  const allPositive = handoffs.flatMap(h => h.positiveSignals);

  let summary = `Interview progress: ${handoffs.length} round(s) completed.\n\n`;
  summary += `Topics covered: ${allTopics.join(", ")}\n\n`;
  summary += `Key claims made: ${allClaims.slice(0, 5).map(c => c.claim).join("; ")}\n\n`;
  summary += `Positive observations: ${allPositive.slice(0, 3).join("; ")}`;

  return summary;
}
