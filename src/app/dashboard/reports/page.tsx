"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { interviews } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, Users, CheckCircle2, Target, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  const completedInterviews = interviews.filter((i) => i.status === "completed");
  const inProgressInterviews = interviews.filter((i) => i.status === "in-progress");
  const scheduledInterviews = interviews.filter((i) => i.status === "scheduled");

  // Score distribution
  const lowScore = interviews.filter((i) => i.overallScore > 0 && i.overallScore < 60).length;
  const midScore = interviews.filter((i) => i.overallScore >= 60 && i.overallScore < 80).length;
  const highScore = interviews.filter((i) => i.overallScore >= 80).length;
  const maxScoreCount = Math.max(lowScore, midScore, highScore, 1);

  // Round performance
  const hrPassed = interviews.filter((i) => i.rounds.hr.score >= 60).length;
  const hrTotal = interviews.filter((i) => i.rounds.hr.score > 0).length;
  const techPassed = interviews.filter((i) => i.rounds.technical.score >= 60).length;
  const techTotal = interviews.filter((i) => i.rounds.technical.score > 0).length;
  const codePassed = interviews.filter((i) => i.rounds.coding && i.rounds.coding.score >= 60).length;
  const codeTotal = interviews.filter((i) => i.rounds.coding && i.rounds.coding.score > 0).length;

  const avgScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((acc, i) => acc + i.overallScore, 0) / completedInterviews.length)
    : 0;

  const passRate = completedInterviews.length > 0
    ? Math.round((completedInterviews.filter((i) => i.overallScore >= 60).length / completedInterviews.length) * 100)
    : 0;

  const total = completedInterviews.length + inProgressInterviews.length + scheduledInterviews.length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[--grok-white]">Analytics</h1>
        <p className="text-sm text-[--grok-gray-400]">Interview performance overview</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Interviews"
          value={interviews.length}
          icon={Users}
          color="orange"
        />
        <MetricCard
          label="Completed"
          value={completedInterviews.length}
          icon={CheckCircle2}
          color="green"
        />
        <MetricCard
          label="Avg Score"
          value={avgScore}
          suffix="/100"
          icon={Target}
          color="blue"
        />
        <MetricCard
          label="Pass Rate"
          value={`${passRate}%`}
          icon={passRate >= 50 ? TrendingUp : TrendingDown}
          color={passRate >= 50 ? "green" : "red"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Score Distribution - Custom Bar Chart */}
        <Card className="border-[--color-border] bg-[--grok-gray-900]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-[--grok-white]">Score Distribution</h3>
              <Badge variant="outline" className="bg-[--grok-gray-800] text-[--grok-gray-400] border-[--color-border] text-xs">
                {interviews.filter(i => i.overallScore > 0).length} scored
              </Badge>
            </div>
            
            <div className="flex items-end justify-between gap-6 h-32">
              <ScoreBar label="0-59" count={lowScore} max={maxScoreCount} color="bg-red-500" />
              <ScoreBar label="60-79" count={midScore} max={maxScoreCount} color="bg-orange-500" />
              <ScoreBar label="80-100" count={highScore} max={maxScoreCount} color="bg-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown - Custom Donut */}
        <Card className="border-[--color-border] bg-[--grok-gray-900]">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-[--grok-white] mb-6">Status Breakdown</h3>
            
            <div className="flex items-center gap-8">
              {/* Donut Chart */}
              <div className="relative size-28 shrink-0">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a1a" strokeWidth="12" />
                  {total > 0 && (
                    <>
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#22c55e"
                        strokeWidth="12"
                        strokeDasharray={`${(completedInterviews.length / total) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#f97316"
                        strokeWidth="12"
                        strokeDasharray={`${(inProgressInterviews.length / total) * 251.2} 251.2`}
                        strokeDashoffset={`-${(completedInterviews.length / total) * 251.2}`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#3b82f6"
                        strokeWidth="12"
                        strokeDasharray={`${(scheduledInterviews.length / total) * 251.2} 251.2`}
                        strokeDashoffset={`-${((completedInterviews.length + inProgressInterviews.length) / total) * 251.2}`}
                        strokeLinecap="round"
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-[--grok-white]">{total}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3 flex-1">
                <LegendItem color="bg-green-500" label="Completed" value={completedInterviews.length} />
                <LegendItem color="bg-orange-500" label="In Progress" value={inProgressInterviews.length} />
                <LegendItem color="bg-blue-500" label="Scheduled" value={scheduledInterviews.length} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pass Rates */}
      <Card className="border-[--color-border] bg-[--grok-gray-900]">
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-[--grok-white] mb-5">Pass Rates by Round</h3>
          
          <div className="grid grid-cols-3 gap-8">
            <PassRateBar label="HR Screening" passed={hrPassed} total={hrTotal} />
            <PassRateBar label="Technical" passed={techPassed} total={techTotal} />
            <PassRateBar label="Coding" passed={codePassed} total={codeTotal} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  label, 
  value, 
  suffix, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number | string; 
  suffix?: string;
  icon: React.ElementType; 
  color: "orange" | "green" | "blue" | "red";
}) {
  const colors = {
    orange: "text-[--grok-accent] bg-[--grok-accent]/10",
    green: "text-green-500 bg-green-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    red: "text-red-500 bg-red-500/10",
  };

  return (
    <Card className="border-[--color-border] bg-[--grok-gray-900]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[--grok-gray-400] uppercase tracking-wide">{label}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[--grok-white]">{value}</span>
              {suffix && <span className="text-sm text-[--grok-gray-500]">{suffix}</span>}
            </div>
          </div>
          <div className={`size-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Score Bar Component
function ScoreBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const height = max > 0 ? (count / max) * 100 : 0;
  
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className="w-full h-24 bg-[--grok-gray-800] rounded-lg relative overflow-hidden">
        <div 
          className={`absolute bottom-0 left-0 right-0 ${color} rounded-lg transition-all duration-500`}
          style={{ height: `${height}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-white drop-shadow-lg">{count}</span>
        </div>
      </div>
      <span className="text-xs text-[--grok-gray-400]">{label}</span>
    </div>
  );
}

// Legend Item Component
function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`size-2.5 rounded-full ${color}`} />
        <span className="text-sm text-[--grok-gray-300]">{label}</span>
      </div>
      <span className="text-sm font-semibold text-[--grok-white]">{value}</span>
    </div>
  );
}

// Pass Rate Bar Component
function PassRateBar({ label, passed, total }: { label: string; passed: number; total: number }) {
  const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const color = rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-red-500";
  const textColor = rate >= 80 ? "text-green-500" : rate >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[--grok-gray-300]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[--grok-gray-500]">{passed}/{total}</span>
          <span className={`text-sm font-semibold ${textColor}`}>{rate}%</span>
        </div>
      </div>
      <div className="h-2 bg-[--grok-gray-800] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}
