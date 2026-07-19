import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CandidateScorecard } from "@/components/dashboard/candidate-scorecard";
import { interviews, candidates, jobs } from "@/lib/mock-data";

export default async function InterviewReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const interview = interviews.find((i) => i.id === id);

  if (!interview) {
    notFound();
  }

  const candidate = candidates.find((c) => c.id === interview.candidateId);
  const job = jobs.find((j) => j.id === interview.jobId);

  if (!candidate || !job) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-[--grok-gray-400] hover:text-[--grok-white]">
          <Link href="/dashboard/interviews">
            <ArrowLeft className="size-4 mr-2" />
            Back to Interviews
          </Link>
        </Button>
      </div>

      <CandidateScorecard
        interview={interview}
        candidateName={candidate.name}
        candidateEmail={candidate.email}
        jobTitle={job.title}
        company={job.company}
      />
    </div>
  );
}

