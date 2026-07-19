"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetencyScores } from "@/lib/types";

interface ScoreRadarProps {
  competencies: CompetencyScores;
}

export function ScoreRadar({ competencies }: ScoreRadarProps) {
  const data = [
    { subject: "Technical", value: competencies.technicalProficiency, fullMark: 100 },
    { subject: "Problem Solving", value: competencies.problemSolving, fullMark: 100 },
    { subject: "Communication", value: competencies.communication, fullMark: 100 },
    { subject: "Culture Fit", value: competencies.cultureFit, fullMark: 100 },
    ...(competencies.leadership ? [{ subject: "Leadership", value: competencies.leadership, fullMark: 100 }] : []),
  ];

  return (
    <Card className="border-[--color-border] bg-[--grok-gray-900]">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[--grok-white]">Competency Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke="var(--grok-gray-600)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "var(--grok-gray-400)", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "var(--grok-gray-400)", fontSize: 10 }}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="var(--grok-accent)"
              fill="var(--grok-accent)"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

