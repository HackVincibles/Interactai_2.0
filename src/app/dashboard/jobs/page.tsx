const jobs: any[] = [];
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Code2, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
const interviews: any[] = [];
const candidates: any[] = [];

export default function JobsPage() {
  const getCandidateCount = (jobId: string) => {
    return candidates.filter((c) => c.jobId === jobId).length;
  };

  const getInterviewCount = (jobId: string) => {
    return interviews.filter((i) => i.jobId === jobId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--grok-white]">Job Postings</h1>
          <p className="text-sm text-[--grok-gray-400]">
            Manage job descriptions and interview parameters.
          </p>
        </div>
        <Button className="bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black font-semibold">
          <Plus className="size-4 mr-2" />
          Create Job
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const candidateCount = getCandidateCount(job.id);
          const interviewCount = getInterviewCount(job.id);

          return (
            <Card key={job.id} className="border-[--color-border] bg-[--grok-gray-900] hover:border-[--grok-accent]/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-[--grok-white]">{job.title}</CardTitle>
                    <p className="text-sm text-[--grok-gray-400] mt-1">{job.company}</p>
                  </div>
                  <Badge variant="outline" className="bg-[--grok-accent]/10 text-[--grok-accent] border-[--grok-accent]/30">
                    {job.interviewConfig.codingEnabled ? "3 rounds" : "2 rounds"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[--grok-gray-300] line-clamp-2">{job.description}</p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[--grok-gray-400] uppercase tracking-wide">Requirements</p>
                  <div className="flex flex-wrap gap-1">
                    {job.requirements.slice(0, 3).map((req, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="bg-[--grok-gray-800] text-[--grok-gray-300] border-[--color-border] text-xs"
                      >
                        {req}
                      </Badge>
                    ))}
                    {job.requirements.length > 3 && (
                      <Badge variant="outline" className="bg-[--grok-gray-800] text-[--grok-gray-400] border-[--color-border] text-xs">
                        +{job.requirements.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[--color-border]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[--grok-gray-400]">
                      <MessageSquare className="size-3" />
                      <span>HR: {job.interviewConfig.hrDuration} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-[--grok-gray-400]">
                      <Code2 className="size-3" />
                      <span>Tech: {job.interviewConfig.technicalDuration} min</span>
                    </div>
                  </div>
                  {job.interviewConfig.codingEnabled && (
                    <div className="flex items-center gap-2 text-xs text-[--grok-gray-400]">
                      <Code2 className="size-3" />
                      <span>Coding: {job.interviewConfig.codingDuration} min</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[--color-border]">
                  <div className="flex items-center gap-4 text-xs text-[--grok-gray-400]">
                    <div className="flex items-center gap-1">
                      <Users className="size-3" />
                      <span>{candidateCount} candidates</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{interviewCount} interviews</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[--grok-accent] hover:text-[--grok-accent-hover]">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
