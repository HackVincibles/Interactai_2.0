interface ProblemPanelProps {
  title: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  description: string;
  examples?: { input: string; output: string; explanation?: string }[];
}

export function ProblemPanel({ title, difficulty = "Medium", description, examples = [] }: ProblemPanelProps) {
  return (
    <div className="space-y-3 rounded-xl border border-[--color-border] bg-[--grok-gray-900] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-[--grok-white]">{title}</p>
          <p className="text-xs text-[--grok-gray-400]">Difficulty: {difficulty}</p>
        </div>
        <span className="rounded-full bg-[--grok-gray-800] px-3 py-1 text-xs text-[--grok-accent]">Coding Round</span>
      </div>
      <p className="text-sm text-[--grok-gray-200]">{description}</p>
      {examples.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-[--grok-gray-400]">Examples</p>
          {examples.map((ex, idx) => (
            <div key={idx} className="rounded-lg bg-[--grok-gray-800] p-3 text-sm">
              <p className="text-[--grok-gray-200]">
                <span className="font-semibold">Input:</span> {ex.input}
              </p>
              <p className="text-[--grok-gray-200]">
                <span className="font-semibold">Output:</span> {ex.output}
              </p>
              {ex.explanation && <p className="text-[--grok-gray-400]">{ex.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

