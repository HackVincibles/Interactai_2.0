import { jobs } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

export function JobForm() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Job Openings</CardTitle>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-black">
            <PlusCircle className="size-4" />
            Add role
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground">{job.company}</p>
              </div>
              <Badge variant="outline">
                {job.interviewConfig.codingEnabled ? "3 rounds" : "2 rounds"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{job.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">Key skills: {job.requirements.slice(0, 3).join(", ")}...</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

