import { candidates, jobs } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

export function CandidateTable() {
  const jobById = Object.fromEntries(jobs.map((job) => [job.id, job.title]));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Candidates</CardTitle>
          <Button variant="link" size="sm" asChild className="text-orange-500 p-0 h-auto">
            <Link href="/dashboard/candidates">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((cand) => (
              <TableRow key={cand.id}>
                <TableCell className="font-medium">{cand.name}</TableCell>
                <TableCell>{jobById[cand.jobId] || "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{cand.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="link" size="sm" asChild className="text-orange-500 p-0 h-auto">
                    <a href={cand.resumeUrl} target="_blank" rel="noopener noreferrer">View</a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

