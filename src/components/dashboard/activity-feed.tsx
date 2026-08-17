"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, CheckCircle2, Code2, MessageSquare, Briefcase, ArrowUpRight } from "lucide-react";
const interviews: any[] = [];
const candidates: any[] = [];
const jobs: any[] = [];
import Link from "next/link";

export function ActivityFeed() {
  const getCandidate = (candidateId: string) => candidates.find((c) => c.id === candidateId);
  const getJob = (jobId: string) => jobs.find((j) => j.id === jobId);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Get recent activity (completed interviews and in-progress updates)
  const recentActivity = interviews
    .filter((i) => i.status === "completed" || i.status === "in-progress")
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.createdAt || 0).getTime();
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 4);

  const getActivityConfig = (interview: typeof interviews[0]) => {
    if (interview.status === "completed") {
      return {
        icon: CheckCircle2,
        iconColor: "text-green-500",
        bgColor: "bg-green-500/10",
        action: "completed",
        badgeColor: "bg-green-500/10 text-green-500 border-green-500/30",
      };
    }
    if (interview.rounds.coding?.status === "in-progress") {
      return {
        icon: Code2,
        iconColor: "text-purple-500",
        bgColor: "bg-purple-500/10",
        action: "coding",
        badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/30",
      };
    }
    if (interview.rounds.technical.status === "in-progress") {
      return {
        icon: MessageSquare,
        iconColor: "text-blue-500",
        bgColor: "bg-blue-500/10",
        action: "technical",
        badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      };
    }
    return {
      icon: Clock,
      iconColor: "text-[--grok-gray-400]",
      bgColor: "bg-[--grok-gray-800]",
      action: "hr",
      badgeColor: "bg-[--grok-gray-800] text-[--grok-gray-300] border-[--grok-gray-700]",
    };
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="border-[--grok-gray-700] bg-[--grok-gray-900]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[--grok-white]">Recent Activity</CardTitle>
          <Link href="/dashboard/interviews" className="text-xs text-[--grok-gray-400] hover:text-[--grok-white] transition-colors">
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-center">
            <Clock className="size-6 text-[--grok-gray-500] mr-2" />
            <p className="text-sm text-[--grok-gray-400]">No recent activity</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {recentActivity.map((interview) => {
              const candidate = getCandidate(interview.candidateId);
              const job = getJob(interview.jobId);
              const config = getActivityConfig(interview);
              const Icon = config.icon;
              const time = interview.completedAt || interview.createdAt;

              return (
                <Link
                  key={interview.id}
                  href={`/dashboard/interviews/${interview.id}/report`}
                  className="flex items-center gap-3 rounded-lg border border-[--grok-gray-700] bg-[--grok-gray-800]/30 p-3 hover:border-[--grok-gray-600] hover:bg-[--grok-gray-800]/50 transition-all group"
                >
                  <div className={`size-10 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`size-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[--grok-white] truncate group-hover:text-[--grok-gray-200] transition-colors">
                        {candidate?.name ?? "Candidate"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.badgeColor}`}>
                        {config.action}
                      </Badge>
                      <span className="text-xs text-[--grok-gray-500]">{formatTime(time)}</span>
                      {interview.overallScore > 0 && (
                        <span className={`text-xs font-semibold ${getScoreColor(interview.overallScore)}`}>
                          {interview.overallScore}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-[--grok-gray-500] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
