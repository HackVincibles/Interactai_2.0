# Interview Platform

An AI-powered interview simulator that stitches together HR, technical, and coding rounds with a shared context. Candidates speak with distinct interviewer personas over voice, tackle live coding prompts in a Monaco IDE, and finish with automatically generated scorecards.

## Highlights
- Multi-round voice interviews powered by XAI’s realtime API and persona-specific prompts.
- Monaco-based coding workspace with timers, tabs, and a built-in test runner.
- Handoff pipeline that carries discussion topics, claims, and follow-ups between rounds.
- Dashboard views for jobs, candidates, transcripts, and reports—all backed by the in-memory store in `lib/store.ts`.

## Prerequisites
- Node.js 18+ (Next.js 16 + React 19 features rely on it).
- `npm` 9+ (or your preferred pnpm/yarn/bun).
- `XAI_API_KEY` set in `.env.local` so the voice hooks can mint session tokens.

## Local Setup
1. Install packages:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` (create the example if you need to) and add:
   ```
   XAI_API_KEY=your_xai_api_key
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000` and jump into `/dashboard` or `/interview/[id]`.

## Scripts
- `npm run dev` – Start the Next.js dev server with hot reload.
- `npm run lint` – ESLint using the repo’s shared config.
- `npm run build` – Production build of the app router project.
- `npm run start` – Serve the built app (after `npm run build`).

## Project Tour
- `src/app/api/interview/session` – Issues ephemeral tokens and wires the right persona prompt.
- `src/app/api/interview/analyze` – Scores rounds and produces the insights cards.
- `src/app/api/resume/parse` – Stubbed parser that feeds the dashboard candidate list.
- `src/app/api/interview/handoff` – Persists round-to-round context.
- `src/components/coding` – Monaco editor wrapper, timer, transcript panel, and helpers.
- `src/components/dashboard` – Activity feed, pipeline, radar, and job form widgets.
- `src/hooks` – Voice/audio lifecycle (`use-interview-voice`, `use-interview-audio`), coding telemetry, and handoff helpers.
- `src/lib` – Prompts, problem sets, the in-memory store, and utility types.

## Voice + Coding Flow
1. Candidate enters the interview route.
2. `use-interview-voice` requests a session token from `/api/interview/session`, which plugs in handoff context and persona instructions.
3. Audio flows through `use-interview-audio` (PCM16 to Float32 conversions live in `lib/audio-utils.ts`).
4. Coding rounds render the Monaco workspace, problem statement, and tests from `lib/coding-problems.ts`.
5. Results feed `lib/round-handoff.ts`, which keeps later rounds informed without leaking scores or hiring recommendations.

## Deployment Notes
- The project is built for Vercel, but any platform that supports Node 18 and `next start` will work.
- Replace the in-memory `lib/store.ts` with a database layer before putting this into production—everything ships with mocked data for now.

If you spot rough edges or want to extend the pipeline, open an issue or start a PR. Happy interviewing.
