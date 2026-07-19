import Link from "next/link";

const features = [
  { title: "Voice & Video", desc: "Grok-powered real-time interviews across 3 rounds." },
  { title: "Coding IDE", desc: "Monaco editor with tests for live pair-programming." },
  { title: "Admin Dashboard", desc: "Configure roles, candidates, and interview automations." },
  { title: "Reports", desc: "Scores, transcripts, and decision support at a glance." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[--grok-dark] text-[--grok-white]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="space-y-6">
          <p className="text-sm text-[--grok-gray-400]">HireAI Platform</p>
          <h1 className="text-4xl font-bold leading-tight">
            AI interview assessments across HR, technical, and coding rounds.
          </h1>
          <p className="max-w-2xl text-lg text-[--grok-gray-300]">
            Customize interviews per job description, automate screening with Grok voice/video, and deliver scorecards that
            decide next steps.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-[--grok-accent] px-4 py-2 text-sm font-medium text-[--grok-black] hover:bg-[--grok-accent-hover]"
            >
              Go to dashboard
            </Link>
            <Link
              href="/interview/int-1001"
              className="rounded-md border border-[--color-border] px-4 py-2 text-sm hover:border-[--grok-accent]"
            >
              Preview interview
            </Link>
          </div>
        </header>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-[--color-border] bg-[--grok-gray-900] p-4">
              <p className="text-lg font-semibold">{f.title}</p>
              <p className="text-sm text-[--grok-gray-300]">{f.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
