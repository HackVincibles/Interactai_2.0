import { ClipboardCheck, Clock3, Gauge, Users, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { interviews, candidates } from "@/lib/mock-data";

export function StatsCards() {
  const activeInterviews = interviews.filter((i) => i.status === "in-progress").length;
  const scheduledInterviews = interviews.filter((i) => i.status === "scheduled").length;
  const completedToday = interviews.filter((i) => {
    if (!i.completedAt) return false;
    const completed = new Date(i.completedAt);
    const today = new Date();
    return completed.toDateString() === today.toDateString();
  }).length;
  
  const totalCandidates = candidates.length;
  const avgScore = interviews
    .filter((i) => i.overallScore > 0)
    .reduce((acc, i) => acc + i.overallScore, 0) / interviews.filter((i) => i.overallScore > 0).length || 0;
  
  const pendingReview = interviews.filter((i) => i.status === "completed" && i.overallScore > 0).length;

  const stats = [
    {
      label: "Active Sessions",
      value: activeInterviews.toString(),
      subtext: `${scheduledInterviews} scheduled`,
      icon: Clock3,
      trend: activeInterviews > 0 ? "up" : "neutral",
      color: "text-[--grok-accent]",
      bgColor: "from-orange-500/10 to-orange-600/5",
    },
    {
      label: "Total Candidates",
      value: totalCandidates.toString(),
      subtext: `${completedToday} today`,
      icon: Users,
      trend: "up",
      color: "text-blue-500",
      bgColor: "from-blue-500/10 to-blue-600/5",
    },
    {
      label: "Average Score",
      value: Math.round(avgScore).toString(),
      subtext: `out of 100`,
      icon: Gauge,
      trend: avgScore >= 70 ? "up" : "down",
      color: "text-green-500",
      bgColor: "from-green-500/10 to-green-600/5",
    },
    {
      label: "Pending Review",
      value: pendingReview.toString(),
      subtext: "awaiting decision",
      icon: ClipboardCheck,
      trend: "neutral",
      color: "text-yellow-500",
      bgColor: "from-yellow-500/10 to-yellow-600/5",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-[--color-border] bg-[--grok-gray-900] overflow-hidden hover:border-[--grok-accent]/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-[--grok-gray-400] uppercase tracking-wide">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-[--grok-white]">{stat.value}</p>
                    {stat.trend === "up" && <TrendingUp className="size-4 text-green-500" />}
                    {stat.trend === "down" && <TrendingDown className="size-4 text-red-500" />}
                  </div>
                  <p className="text-xs text-[--grok-gray-500]">{stat.subtext}</p>
                </div>
                <div className={`size-10 rounded-xl bg-gradient-to-br ${stat.bgColor} flex items-center justify-center`}>
                  <Icon size={20} className={stat.color} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
