/**
 * Interview Summary API Route
 * Returns aggregated interview data from all rounds for a given session
 */

import { NextResponse } from "next/server";
import { getInterview } from "@/lib/store";
import type { InterviewSession, CompetencyScores, AIInsights } from "@/lib/types";

interface SummaryResponse {
  interview: InterviewSession;
  overallScore: number;
  overallCompetencies?: CompetencyScores;
  overallRecommendation?: AIInsights["recommendation"];
  roundsCompleted: number;
  totalRounds: number;
}

/**
 * Calculate weighted overall score from all rounds
 * HR: 20%, Technical: 40%, Coding: 40%
 */
function calculateOverallScore(interview: InterviewSession): number {
  const weights = {
    hr: 0.2,
    technical: 0.4,
    coding: 0.4,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  if (interview.rounds.hr.status === "completed") {
    weightedSum += interview.rounds.hr.score * weights.hr;
    totalWeight += weights.hr;
  }

  if (interview.rounds.technical.status === "completed") {
    weightedSum += interview.rounds.technical.score * weights.technical;
    totalWeight += weights.technical;
  }

  if (interview.rounds.coding?.status === "completed") {
    weightedSum += interview.rounds.coding.score * weights.coding;
    totalWeight += weights.coding;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Aggregate competency scores across all rounds
 */
function aggregateCompetencies(interview: InterviewSession): CompetencyScores | undefined {
  const rounds: Array<{ competencies: CompetencyScores }> = [];
  
  if (interview.rounds.hr.status === "completed" && interview.rounds.hr.competencies) {
    rounds.push({ competencies: interview.rounds.hr.competencies });
  }
  if (interview.rounds.technical.status === "completed" && interview.rounds.technical.competencies) {
    rounds.push({ competencies: interview.rounds.technical.competencies });
  }
  if (interview.rounds.coding?.status === "completed" && interview.rounds.coding.competencies) {
    rounds.push({ competencies: interview.rounds.coding.competencies });
  }

  if (rounds.length === 0) return undefined;

  const aggregated: CompetencyScores = {
    technicalProficiency: 0,
    problemSolving: 0,
    communication: 0,
    cultureFit: 0,
  };

  rounds.forEach((round) => {
    aggregated.technicalProficiency += round.competencies.technicalProficiency || 0;
    aggregated.problemSolving += round.competencies.problemSolving || 0;
    aggregated.communication += round.competencies.communication || 0;
    aggregated.cultureFit += round.competencies.cultureFit || 0;
    if (round.competencies.leadership) {
      aggregated.leadership = (aggregated.leadership || 0) + round.competencies.leadership;
    }
  });

  // Average the scores
  const count = rounds.length;
  aggregated.technicalProficiency = Math.round(aggregated.technicalProficiency / count);
  aggregated.problemSolving = Math.round(aggregated.problemSolving / count);
  aggregated.communication = Math.round(aggregated.communication / count);
  aggregated.cultureFit = Math.round(aggregated.cultureFit / count);
  if (aggregated.leadership) {
    aggregated.leadership = Math.round(aggregated.leadership / count);
  }

  return aggregated;
}

/**
 * Determine overall recommendation from round insights
 */
function getOverallRecommendation(interview: InterviewSession): AIInsights["recommendation"] | undefined {
  const recommendations: AIInsights["recommendation"][] = [];

  if (interview.rounds.hr.insights?.recommendation) {
    recommendations.push(interview.rounds.hr.insights.recommendation);
  }
  if (interview.rounds.technical.insights?.recommendation) {
    recommendations.push(interview.rounds.technical.insights.recommendation);
  }
  if (interview.rounds.coding?.insights?.recommendation) {
    recommendations.push(interview.rounds.coding.insights.recommendation);
  }

  if (recommendations.length === 0) return undefined;

  // Use the most conservative recommendation (lowest in hierarchy)
  const hierarchy: Record<AIInsights["recommendation"], number> = {
    "strong-hire": 4,
    "hire": 3,
    "maybe": 2,
    "no-hire": 1,
  };

  return recommendations.reduce((min, rec) => 
    hierarchy[rec] < hierarchy[min] ? rec : min
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const interview = getInterview(sessionId);

    if (!interview) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    // Calculate aggregated metrics
    const overallScore = calculateOverallScore(interview);
    const overallCompetencies = aggregateCompetencies(interview);
    const overallRecommendation = getOverallRecommendation(interview);

    // Count completed rounds
    const roundsCompleted = [
      interview.rounds.hr.status === "completed",
      interview.rounds.technical.status === "completed",
      interview.rounds.coding?.status === "completed",
    ].filter(Boolean).length;

    const totalRounds = interview.rounds.coding ? 3 : 2;

    const response: SummaryResponse = {
      interview,
      overallScore,
      overallCompetencies,
      overallRecommendation,
      roundsCompleted,
      totalRounds,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] Summary error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
