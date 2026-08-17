"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Clock, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";
const interviews: any[] = [];
const candidates: any[] = [];
const jobs: any[] = [];

export function InterviewPipeline() {
  const scheduled = interviews.filter((i) => i.status === "scheduled");
  const inProgress = interviews.filter((i) => i.status === "in-progress");
  const completed = interviews.filter((i) => i.status === "completed");

  const getCandidate = (candidateId: string) => candidates.find((c) => c.id === candidateId);
  const getJob = (jobId: string) => jobs.find((j) => j.id === jobId);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 bg-green-500/10 border-green-500/30";
    if (score >= 60) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    return "text-red-500 bg-red-500/10 border-red-500/30";
  };

  const RoundIndicator = ({ status }: { status: string }) => {
    if (status === "completed") {
      return <CheckCircle2 className="size-3.5 text-green-500" />;
    }
    if (status === "in-progress") {
      return <Clock className="size-3.5 text-blue-500 animate-pulse" />;
    }
    return <Circle className="size-3.5 text-[--grok-gray-500]" />;
  };

  const PipelineCard = ({ interview }: { interview: typeof interviews[0] }) => {
    const candidate = getCandidate(interview.candidateId);
    const job = getJob(interview.jobId);

    return (
      <Link href={`/dashboard/interviews/${interview.id}/report`}>
        <div className="rounded-lg border border-[--grok-gray-700] bg-[--grok-gray-800]/50 p-4 hover:border-[--grok-gray-600] hover:bg-[--grok-gray-800] transition-all cursor-pointer group">
          <div className="flex items-start gap-3">
            <Avatar className="size-10 border-2 border-[--grok-gray-700] group-hover:border-[--grok-gray-600] transition-colors">
              <AvatarFallback className="bg-gradient-to-br from-[--grok-gray-700] to-[--grok-gray-800] text-[--grok-white] text-xs font-medium">
                {getInitials(candidate?.name ?? "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[--grok-white] group-hover:text-[--grok-gray-200] transition-colors truncate">
                    {candidate?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-[--grok-gray-400] truncate">{job?.title ?? "—"}</p>
                </div>
                {interview.overallScore > 0 && (
                  <Badge variant="outline" className={`text-xs font-semibold ${getScoreColor(interview.overallScore)}`}>
                    {interview.overallScore}
                  </Badge>
                )}
              </div>

              {/* Round Progress */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[--grok-gray-700]/50">
                <div className="flex items-center gap-1.5">
                  <RoundIndicator status={interview.rounds.hr.status} />
                  <span className="text-xs text-[--grok-gray-400]">HR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RoundIndicator status={interview.rounds.technical.status} />
                  <span className="text-xs text-[--grok-gray-400]">Tech</span>
                </div>
                {interview.rounds.coding && (
                  <div className="flex items-center gap-1.5">
                    <RoundIndicator status={interview.rounds.coding.status} />
                    <span className="text-xs text-[--grok-gray-400]">Code</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const PipelineColumn = ({
    title,
    count,
    interviews: interviewList,
    accentColor,
    bgColor,
  }: {
    title: string;
    count: number;
    interviews: typeof interviews;
    accentColor: string;
    bgColor: string;
  }) => (
    <div className="flex-1 min-w-0">
      {/* Column Header */}
      <div className={`rounded-t-lg ${bgColor} px-4 py-3 border border-b-0 border-[--grok-gray-700]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full ${accentColor}`} />
            <h3 className="text-sm font-semibold text-[--grok-white]">{title}</h3>
          </div>
          <Badge variant="outline" className="bg-[--grok-gray-800] text-[--grok-gray-300] border-[--grok-gray-700] text-xs">
            {count}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <div className="rounded-b-lg border border-t-0 border-[--grok-gray-700] bg-[--grok-gray-900]/50 p-3">
        <ScrollArea className="h-[320px]">
          <div className="space-y-3 pr-2">
            {interviewList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="size-10 rounded-full bg-[--grok-gray-800] flex items-center justify-center mb-3">
                  <Circle className="size-5 text-[--grok-gray-500]" />
                </div>
                <p className="text-xs text-[--grok-gray-400]">No interviews</p>
              </div>
            ) : (
              interviewList.slice(0, 5).map((interview) => (
                <PipelineCard key={interview.id} interview={interview} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <Card className="border-[--grok-gray-700] bg-[--grok-gray-900]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[--grok-white]">Interview Pipeline</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-[--grok-gray-400] hover:text-[--grok-white] hover:bg-[--grok-gray-800]">
            <Link href="/dashboard/interviews" className="flex items-center gap-1">
              View all
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <PipelineColumn
            title="Scheduled"
            count={scheduled.length}
            interviews={scheduled}
            accentColor="bg-blue-500"
            bgColor="bg-blue-500/5"
          />
          <PipelineColumn
            title="In Progress"
            count={inProgress.length}
            interviews={inProgress}
            accentColor="bg-[--grok-accent]"
            bgColor="bg-[--grok-accent]/5"
          />
          <PipelineColumn
            title="Completed"
            count={completed.length}
            interviews={completed}
            accentColor="bg-green-500"
            bgColor="bg-green-500/5"
          />
        </div>
      </CardContent>
    </Card>
  );
}
