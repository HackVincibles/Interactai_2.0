import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  Share2, 
  Calendar,
  Lightbulb,
  MessageSquare,
  FileText
} from "lucide-react";
import { InterviewSession, AIInsights } from "@/lib/types";
import { RoundProgress } from "./round-progress";
import { ScoreRadar } from "./score-radar";

interface CandidateScorecardProps {
  interview: InterviewSession;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
}

export function CandidateScorecard({
  interview,
  candidateName,
  candidateEmail,
  jobTitle,
  company,
}: CandidateScorecardProps) {
  const insights = interview.overallInsights || interview.rounds.hr.insights;
  const competencies = interview.overallCompetencies || interview.rounds.hr.competencies;

  const getRecommendationBadge = (recommendation: AIInsights["recommendation"]) => {
    const configs = {
      "strong-hire": {
        label: "Strong Hire",
        className: "bg-green-500/10 text-green-500 border-green-500/30",
        icon: CheckCircle2,
      },
      hire: {
        label: "Hire",
        className: "bg-blue-500/10 text-blue-500 border-blue-500/30",
        icon: CheckCircle2,
      },
      maybe: {
        label: "Maybe",
        className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
        icon: AlertTriangle,
      },
      "no-hire": {
        label: "No Hire",
        className: "bg-red-500/10 text-red-500 border-red-500/30",
        icon: AlertTriangle,
      },
    };

    const config = configs[recommendation];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} text-base px-4 py-2`}>
        <Icon className="size-4 mr-2" />
        {config.label}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[--grok-white]">{candidateName}</h1>
          <p className="text-sm text-[--grok-gray-400] mt-1">{candidateEmail}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-[--grok-gray-800] text-[--grok-gray-400] border-[--color-border]">
              {jobTitle}
            </Badge>
            <span className="text-sm text-[--grok-gray-400]">at {company}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-[--color-border] bg-[--grok-gray-800] text-[--grok-white] hover:bg-[--grok-gray-700]">
            <Share2 className="size-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="border-[--color-border] bg-[--grok-gray-800] text-[--grok-white] hover:bg-[--grok-gray-700]">
            <Download className="size-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Recommendation Banner */}
      {insights && (
        <Card className="border-[--color-border] bg-gradient-to-r from-[--grok-gray-900] to-[--grok-gray-800]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getRecommendationBadge(insights.recommendation)}
                  <Badge variant="outline" className="bg-[--grok-gray-800] text-[--grok-gray-400] border-[--color-border]">
                    Confidence: {insights.confidence}%
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className={`text-4xl font-bold ${getScoreColor(interview.overallScore)}`}>
                    {interview.overallScore}
                  </span>
                  <span className="text-lg text-[--grok-gray-400]">/100</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Round Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-[--grok-white] mb-4">Round Breakdown</h2>
        <RoundProgress
          hr={interview.rounds.hr}
          technical={interview.rounds.technical}
          coding={interview.rounds.coding}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Competency Radar */}
        {competencies && (
          <ScoreRadar competencies={competencies} />
        )}

        {/* AI Insights */}
        {insights && (
          <Card className="border-[--color-border] bg-[--grok-gray-900]">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[--grok-white] flex items-center gap-2">
                <Lightbulb className="size-4 text-[--grok-accent]" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.strengths.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-green-500 mb-2 flex items-center gap-2">
                    <TrendingUp className="size-4" />
                    Strengths
                  </h3>
                  <ul className="space-y-1">
                    {insights.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-[--grok-gray-300] flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-500 mt-0.5 flex-none" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.areasForGrowth.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-yellow-500 mb-2 flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    Areas for Growth
                  </h3>
                  <ul className="space-y-1">
                    {insights.areasForGrowth.map((area, idx) => (
                      <li key={idx} className="text-sm text-[--grok-gray-300] flex items-start gap-2">
                        <AlertTriangle className="size-4 text-yellow-500 mt-0.5 flex-none" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.redFlags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    Red Flags
                  </h3>
                  <ul className="space-y-1">
                    {insights.redFlags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-red-400 flex items-start gap-2">
                        <AlertTriangle className="size-4 mt-0.5 flex-none" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.redFlags.length === 0 && (
                <div className="text-sm text-green-500 flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  No red flags detected
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transcript Highlights */}
      {(interview.rounds.hr.highlights || interview.rounds.technical.highlights) && (
        <Card className="border-[--color-border] bg-[--grok-gray-900]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[--grok-white] flex items-center gap-2">
              <MessageSquare className="size-4 text-[--grok-accent]" />
              Transcript Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {interview.rounds.hr.highlights?.map((highlight, idx) => (
                <div key={idx} className="rounded-lg bg-[--grok-gray-800] p-3 border-l-2 border-[--grok-accent]">
                  <p className="text-sm text-[--grok-gray-200]">"{highlight}"</p>
                  <p className="text-xs text-[--grok-gray-400] mt-1">HR Round</p>
                </div>
              ))}
              {interview.rounds.technical.highlights?.map((highlight, idx) => (
                <div key={idx} className="rounded-lg bg-[--grok-gray-800] p-3 border-l-2 border-blue-500">
                  <p className="text-sm text-[--grok-gray-200]">"{highlight}"</p>
                  <p className="text-xs text-[--grok-gray-400] mt-1">Technical Round</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

