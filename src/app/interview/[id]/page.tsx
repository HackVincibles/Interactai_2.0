import Link from "next/link";
import { getInterviewById, getJobById, getUserById } from "@/lib/firestore-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mic, Camera, Wifi, ArrowLeft } from "lucide-react";

export default async function InterviewLobby({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getInterviewById(id);
  const candidate = session ? await getUserById(session.candidateId) : null;
  const job = session?.jobId ? await getJobById(session.jobId) : null;

  const interviewRounds = [
    { id: "hr", label: "HR Round", path: "hr", duration: "10 mins", description: "Behavioral & Cultural Fit" },
    { id: "technical", label: "Technical Round", path: "technical", duration: "20 mins", description: "System Design & Architecture" },
    { id: "coding", label: "Coding Round", path: "coding", duration: "30 mins", description: "Data Structures & Algorithms" }
  ];

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Interview Session</p>
            <h1 className="text-2xl font-semibold">{job?.title ?? "Role"}</h1>
            <p className="text-sm text-muted-foreground">{job?.company ?? "Company"}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/interviews">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Candidate</CardDescription>
                <CardTitle>{candidate?.name ?? "Candidate"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{candidate?.email}</p>
                <p className="mt-2 text-xs text-muted-foreground">Session ID: {id}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>System Check</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Mic className="size-4" />
                      <span>Microphone</span>
                    </div>
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      <CheckCircle className="size-3 mr-1" /> Ready
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Camera className="size-4" />
                      <span>Camera</span>
                    </div>
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      <CheckCircle className="size-3 mr-1" /> Ready
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Wifi className="size-4" />
                      <span>Connection</span>
                    </div>
                    <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                      Grok Realtime
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-4">
                  {interviewRounds.map((round) => (
                    <Link 
                      key={round.path} 
                      href={`/interview/${id}/${round.path}`}
                      className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
                    >
                      Start {round.label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Rounds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {interviewRounds.map((round) => (
                  <div key={round.path} className="rounded-lg bg-muted/50 p-3">
                    <p className="font-medium">{round.label}</p>
                    <p className="text-xs text-muted-foreground">{round.duration}</p>
                    <p className="text-xs text-muted-foreground mt-1">{round.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

