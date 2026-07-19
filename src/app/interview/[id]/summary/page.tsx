"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Code2, 
  User, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Download,
  Mail,
  Briefcase,
} from "lucide-react";
import type { InterviewSession, CompetencyScores, AIInsights } from "@/lib/types";

interface SummaryData {
  interview: InterviewSession;
  overallScore: number;
  overallCompetencies?: CompetencyScores;
  overallRecommendation?: AIInsights["recommendation"];
  roundsCompleted: number;
  totalRounds: number;
  // Enriched by the summary API
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  jobTitle?: string;
  jobCompany?: string;
}

export default function InterviewSummary({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch(`/api/interview/summary?sessionId=${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch summary");
        }
        const data = await response.json();
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[--grok-dark] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--grok-accent] mx-auto mb-4"></div>
          <p className="text-[--grok-gray-400]">Loading interview summary...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[--grok-dark] flex items-center justify-center">
        <Card className="w-full max-w-md bg-[--grok-gray-900]">
          <CardContent className="pt-6">
            <p className="text-red-400 mb-4">{error || "Summary not found"}</p>
            <Button asChild variant="outline">
              <Link href={`/interview/${id}`}>
                <ArrowLeft className="size-4 mr-2" />
                Back to Interview
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { interview, overallScore, overallCompetencies, overallRecommendation, roundsCompleted, totalRounds,
    candidateName, candidateEmail, candidatePhone, jobTitle, jobCompany } = summary;

  const getRecommendationColor = (rec?: AIInsights["recommendation"]) => {
    switch (rec) {
      case "strong-hire":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "hire":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "maybe":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "no-hire":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-[--grok-gray-800] text-[--grok-gray-400]";
    }
  };

  const getRecommendationLabel = (rec?: AIInsights["recommendation"]) => {
    switch (rec) {
      case "strong-hire":
        return "Strong Hire";
      case "hire":
        return "Hire";
      case "maybe":
        return "Maybe";
      case "no-hire":
        return "No Hire";
      default:
        return "Pending";
    }
  };

  return (
    <div className="min-h-screen bg-[--grok-dark] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[--grok-gray-400]">Interview Summary</p>
            <h1 className="text-3xl font-bold text-[--grok-white] mt-1">
              {candidateName || "Candidate"}
            </h1>
            <p className="text-sm text-[--grok-gray-400] mt-1">
              {jobTitle} {jobCompany ? `at ${jobCompany}` : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/interviews">
                <ArrowLeft className="size-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button variant="outline" className="bg-[--grok-accent]/10 hover:bg-[--grok-accent]/20 border-[--grok-accent]/30">
              <Download className="size-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overall Score Card */}
        <Card className="bg-[--grok-gray-900] border-[--grok-accent]/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Overall Assessment</CardDescription>
                <CardTitle className="text-2xl text-[--grok-white] mt-2">
                  {overallScore}% Overall Score
                </CardTitle>
              </div>
              <Badge className={`text-lg px-4 py-2 ${getRecommendationColor(overallRecommendation)}`}>
                {getRecommendationLabel(overallRecommendation)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {overallCompetencies && (
                <>
                  <div className="text-center p-3 rounded-lg bg-[--grok-gray-800]">
                    <p className="text-xs text-[--grok-gray-400] mb-1">Technical</p>
                    <p className="text-xl font-semibold text-[--grok-white]">
                      {overallCompetencies.technicalProficiency}%
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-[--grok-gray-800]">
                    <p className="text-xs text-[--grok-gray-400] mb-1">Problem Solving</p>
                    <p className="text-xl font-semibold text-[--grok-white]">
                      {overallCompetencies.problemSolving}%
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-[--grok-gray-800]">
                    <p className="text-xs text-[--grok-gray-400] mb-1">Communication</p>
                    <p className="text-xl font-semibold text-[--grok-white]">
                      {overallCompetencies.communication}%
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-[--grok-gray-800]">
                    <p className="text-xs text-[--grok-gray-400] mb-1">Culture Fit</p>
                    <p className="text-xl font-semibold text-[--grok-white]">
                      {overallCompetencies.cultureFit}%
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-[--color-border]">
              <p className="text-sm text-[--grok-gray-400]">
                {roundsCompleted} of {totalRounds} rounds completed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Info */}
        <Card className="bg-[--grok-gray-900] border-[--color-border]">
          <CardHeader>
            <CardTitle className="text-lg text-[--grok-white] flex items-center gap-2">
              <User className="size-5" />
              Candidate Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-[--grok-gray-400]" />
              <span className="text-[--grok-white]">{candidateEmail ?? interview.candidateId}</span>
            </div>
            {candidatePhone && (
              <div className="flex items-center gap-3">
                <Briefcase className="size-4 text-[--grok-gray-400]" />
                <span className="text-[--grok-white]">{candidatePhone}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <FileText className="size-4 text-[--grok-gray-400]" />
              <span className="text-[--grok-gray-400] text-sm">Session ID: {id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Round Results */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* HR Round */}
          <Card className="bg-[--grok-gray-900] border-[--color-border]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[--grok-white]">HR Screening</CardTitle>
                {interview.rounds.hr.status === "completed" && (
                  <CheckCircle2 className="size-5 text-green-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {interview.rounds.hr.status === "completed" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--grok-gray-400]">Score</span>
                    <span className="text-xl font-semibold text-[--grok-white]">
                      {interview.rounds.hr.score}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--grok-gray-400]">Duration</span>
                    <span className="text-[--grok-white]">{interview.rounds.hr.duration} min</span>
                  </div>
                  {interview.rounds.hr.handoff && (
                    <div className="pt-3 border-t border-[--color-border]">
                      <p className="text-xs text-[--grok-gray-400] mb-2">Topics Discussed</p>
                      <div className="flex flex-wrap gap-1">
                        {interview.rounds.hr.handoff.topicsDiscussed.slice(0, 3).map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {interview.rounds.hr.insights && (
                    <div className="pt-3 border-t border-[--color-border]">
                      <p className="text-xs text-[--grok-gray-400] mb-1">Recommendation</p>
                      <Badge className={getRecommendationColor(interview.rounds.hr.insights.recommendation)}>
                        {getRecommendationLabel(interview.rounds.hr.insights.recommendation)}
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[--grok-gray-400]">Not completed</p>
              )}
            </CardContent>
          </Card>

          {/* Technical Round */}
          <Card className="bg-[--grok-gray-900] border-[--color-border]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[--grok-white]">Technical Interview</CardTitle>
                {interview.rounds.technical.status === "completed" && (
                  <CheckCircle2 className="size-5 text-green-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {interview.rounds.technical.status === "completed" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--grok-gray-400]">Score</span>
                    <span className="text-xl font-semibold text-[--grok-white]">
                      {interview.rounds.technical.score}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--grok-gray-400]">Duration</span>
                    <span className="text-[--grok-white]">{interview.rounds.technical.duration} min</span>
                  </div>
                  {interview.rounds.technical.handoff && (
                    <div className="pt-3 border-t border-[--color-border]">
                      <p className="text-xs text-[--grok-gray-400] mb-2">Claims Verified</p>
                      <p className="text-sm text-[--grok-white]">
                        {interview.rounds.technical.handoff.candidateClaims.length} claims discussed
                      </p>
                    </div>
                  )}
                  {interview.rounds.technical.insights && (
                    <div className="pt-3 border-t border-[--color-border]">
                      <p className="text-xs text-[--grok-gray-400] mb-1">Recommendation</p>
                      <Badge className={getRecommendationColor(interview.rounds.technical.insights.recommendation)}>
                        {getRecommendationLabel(interview.rounds.technical.insights.recommendation)}
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[--grok-gray-400]">Not completed</p>
              )}
            </CardContent>
          </Card>

          {/* Coding Round */}
          <Card className="bg-[--grok-gray-900] border-[--color-border]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[--grok-white]">Coding Interview</CardTitle>
                {interview.rounds.coding?.status === "completed" && (
                  <CheckCircle2 className="size-5 text-green-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {interview.rounds.coding?.status === "completed" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--grok-gray-400]">Score</span>
                    <span className="text-xl font-semibold text-[--grok-white]">
                      {interview.rounds.coding.score}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[--grok-gray-400]">Duration</span>
                    <span className="text-[--grok-white]">{interview.rounds.coding.duration} min</span>
                  </div>
                  {interview.rounds.coding.insights && (
                    <div className="pt-3 border-t border-[--color-border]">
                      <p className="text-xs text-[--grok-gray-400] mb-1">Recommendation</p>
                      <Badge className={getRecommendationColor(interview.rounds.coding.insights.recommendation)}>
                        {getRecommendationLabel(interview.rounds.coding.insights.recommendation)}
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[--grok-gray-400]">Not completed</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button asChild className="bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black">
            <Link href={`/interview/${id}`}>
              View Full Details
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/interviews">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
