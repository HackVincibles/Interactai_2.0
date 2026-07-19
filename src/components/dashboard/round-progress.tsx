import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Circle } from "lucide-react";
import { RoundResult } from "@/lib/types";

interface RoundProgressProps {
  hr: RoundResult;
  technical: RoundResult;
  coding?: RoundResult;
}

export function RoundProgress({ hr, technical, coding }: RoundProgressProps) {
  const rounds = [
    { name: "HR Screening", result: hr, color: "text-orange-500" },
    { name: "Technical", result: technical, color: "text-blue-500" },
    ...(coding ? [{ name: "Coding", result: coding, color: "text-purple-500" }] : []),
  ];

  const getStatusIcon = (status: RoundResult["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="size-4 text-green-500" />;
      case "in-progress":
        return <Clock className="size-4 text-[--grok-accent] animate-spin" />;
      default:
        return <Circle className="size-4 text-[--grok-gray-400]" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-500 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
    return "bg-red-500/10 text-red-500 border-red-500/30";
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {rounds.map((round, idx) => (
        <Card key={idx} className="border-[--color-border] bg-[--grok-gray-900]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[--grok-white]">{round.name}</CardTitle>
              {getStatusIcon(round.result.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {round.result.status === "completed" ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[--grok-white]">{round.result.score}</span>
                  <span className="text-sm text-[--grok-gray-400]">/100</span>
                </div>
                <Progress value={round.result.score} className="h-2" />
                <Badge variant="outline" className={`${getScoreColor(round.result.score)} w-fit`}>
                  {round.result.score >= 80 ? "Excellent" : round.result.score >= 60 ? "Good" : "Needs Improvement"}
                </Badge>
                {round.result.feedback && (
                  <p className="text-xs text-[--grok-gray-400] line-clamp-2">{round.result.feedback}</p>
                )}
              </>
            ) : round.result.status === "in-progress" ? (
              <div className="text-center py-4">
                <p className="text-sm text-[--grok-accent]">In Progress</p>
                <p className="text-xs text-[--grok-gray-400] mt-1">Round is currently active</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-[--grok-gray-400]">Pending</p>
                <p className="text-xs text-[--grok-gray-400] mt-1">Not started yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

