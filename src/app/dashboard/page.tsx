import { StatsCards } from "@/components/dashboard/stats-cards";
import { InterviewPipeline } from "@/components/dashboard/interview-pipeline";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { interviews, candidates, jobs } from "@/lib/mock-data";
import Link from "next/link";
import { Video, ArrowRight, Plus, Play } from "lucide-react";

export default function DashboardPage() {
  const liveSessions = interviews.filter((i) => i.status === "in-progress");
  const getCandidate = (candidateId: string) => candidates.find((c) => c.id === candidateId);
  const getJob = (jobId: string) => jobs.find((j) => j.id === jobId);

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--grok-white]">Dashboard</h1>
          <p className="text-sm text-[--grok-gray-400]">
            AI-powered interview assessments
          </p>
        </div>
        <Button className="bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black font-semibold" asChild>
          <Link href="/dashboard/jobs">
            <Plus className="size-4 mr-2" />
            New Job
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Pipeline - Takes 2 columns */}
        <div className="xl:col-span-2">
          <InterviewPipeline />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Live Sessions */}
          <Card className="border-[--grok-gray-700] bg-[--grok-gray-900]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[--grok-white] flex items-center gap-2">
                  <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                  Live Sessions
                </CardTitle>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
                  {liveSessions.length} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {liveSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Video className="size-8 text-[--grok-gray-500] mb-2" />
                  <p className="text-sm text-[--grok-gray-400]">No active sessions</p>
                </div>
              ) : (
                liveSessions.slice(0, 3).map((interview) => {
                  const candidate = getCandidate(interview.candidateId);
                  const job = getJob(interview.jobId);
                  const currentRound = interview.rounds.coding?.status === "in-progress"
                    ? "Coding"
                    : interview.rounds.technical.status === "in-progress"
                    ? "Technical"
                    : "HR";

                  return (
                    <Link
                      key={interview.id}
                      href={`/interview/${interview.id}`}
                      className="flex items-center gap-3 rounded-lg border border-[--grok-gray-700] bg-[--grok-gray-800]/50 p-3 hover:border-[--grok-gray-600] hover:bg-[--grok-gray-800] transition-all group"
                    >
                      <Avatar className="size-9 border-2 border-[--grok-gray-700] group-hover:border-[--grok-gray-600] transition-colors">
                        <AvatarFallback className="bg-[--grok-gray-700] text-[--grok-white] text-xs">
                          {getInitials(candidate?.name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[--grok-white] truncate group-hover:text-[--grok-gray-200] transition-colors">
                          {candidate?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-[--grok-gray-400] truncate">{job?.title ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs">
                          {currentRound}
                        </Badge>
                        <Play className="size-4 text-[--grok-gray-500] group-hover:text-[--grok-gray-400] transition-colors" />
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-[--grok-gray-700] bg-[--grok-gray-900]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[--grok-white]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start border-[--grok-gray-700] hover:border-[--grok-gray-600] hover:bg-[--grok-gray-800] text-xs" asChild>
                <Link href="/dashboard/jobs">
                  <Plus className="size-3 mr-1.5" />
                  New Job
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start border-[--grok-gray-700] hover:border-[--grok-gray-600] hover:bg-[--grok-gray-800] text-xs" asChild>
                <Link href="/dashboard/candidates">
                  <Plus className="size-3 mr-1.5" />
                  Add Candidate
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start border-[--grok-gray-700] hover:border-[--grok-gray-600] hover:bg-[--grok-gray-800] text-xs col-span-2" asChild>
                <Link href="/dashboard/reports">
                  View Analytics
                  <ArrowRight className="size-3 ml-auto" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Feed - Full Width Below */}
      <ActivityFeed />
    </div>
  );
}
