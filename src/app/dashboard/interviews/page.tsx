import { InterviewTable } from "@/components/dashboard/interview-table";
const interviews: any[] = [];
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import Link from "next/link";

export default function InterviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[--grok-white]">Interviews</h1>
          <p className="text-sm text-[--grok-gray-400]">
            Track interview sessions and view candidate reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-[--color-border] bg-[--grok-gray-800] text-[--grok-white] hover:bg-[--grok-gray-700]">
            <Filter className="size-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black font-semibold" asChild>
            <Link href="/dashboard/candidates">
              <Plus className="size-4 mr-2" />
              Schedule Interview
            </Link>
          </Button>
        </div>
      </div>

      <InterviewTable data={interviews} />
    </div>
  );
}
