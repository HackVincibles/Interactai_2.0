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
      {/* Top Navigation */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.477 2 2 6.477 2 12C2 14.0671 2.62278 15.9912 3.68832 17.5902L2.5 21.5L6.64793 20.4651C8.19202 21.4325 10.0306 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill="url(#paint0_linear_logo)"/>
            <path d="M7 10.5C7 9.67157 7.67157 9 8.5 9H15.5C16.3284 9 17 9.67157 17 10.5V13.5C17 14.3284 16.3284 15 15.5 15H13.5L11 17V15H8.5C7.67157 15 7 14.3284 7 13.5V10.5Z" fill="white"/>
            <circle cx="10" cy="12" r="0.8" fill="url(#paint0_linear_logo)"/>
            <circle cx="12" cy="12" r="0.8" fill="url(#paint0_linear_logo)"/>
            <circle cx="14" cy="12" r="0.8" fill="url(#paint0_linear_logo)"/>
            <defs>
              <linearGradient id="paint0_linear_logo" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8B5CF6"/>
                <stop offset="1" stopColor="#3B82F6"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="font-bold">Interact AI</span>
        </div>
        <div>
          <Link
            href="/login"
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

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
