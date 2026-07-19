# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interview Platform is an AI-powered interview system using XAI's Grok voice API for realistic, multi-round candidate assessments. The platform simulates HR screening, technical interviews, and coding challenges with distinct AI interviewer personas.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npm run start    # Start production server
```

## Architecture

### Tech Stack
- **Next.js 16** with App Router (React 19)
- **XAI Realtime API** for voice-based interviews via WebSocket
- **Tailwind CSS 4** with Radix UI components
- **Monaco Editor** for coding interview IDE
- **Mastra** for AI agent orchestration (configured but not heavily used yet)

### Core Data Flow

```
Candidate Created → Interview Session → Multi-Round Voice Interviews → AI Analysis → Scorecard
```

1. **Candidate Onboarding** (`/dashboard/candidates`): Resume parsing via `/api/resume/parse`
2. **Interview Session** (`/interview/[id]`): Routes to HR, Technical, or Coding rounds
3. **Voice Connection**: Client hooks → `/api/interview/session` → XAI WebSocket
4. **Post-Interview Analysis**: `/api/interview/analyze` generates competency scores

### Key Directories

```
src/
├── app/
│   ├── api/
│   │   ├── interview/session/   # XAI token generation, prompt selection
│   │   ├── interview/analyze/   # Post-interview AI scoring
│   │   ├── candidates/          # Candidate CRUD
│   │   └── resume/parse/        # PDF/DOCX resume extraction
│   ├── dashboard/               # Admin views (jobs, candidates, reports)
│   └── interview/[id]/          # Interview room with round subpages
├── components/
│   ├── coding/                  # Monaco editor, problem panel, test runner
│   ├── dashboard/               # Stats, tables, pipeline visualization
│   └── ui/                      # Radix-based primitives (shadcn pattern)
├── hooks/
│   ├── use-interview-voice.ts   # WebSocket connection to XAI realtime API
│   └── use-interview-audio.ts   # Mic capture, audio playback
└── lib/
    ├── interview-prompts.ts     # System prompts for each interview persona
    ├── store.ts                 # In-memory data store (mock database)
    ├── types.ts                 # Core TypeScript interfaces
    └── audio-utils.ts           # PCM16 ↔ Float32 conversion
```

### Interview Personas

Each round has a distinct AI persona defined in `lib/interview-prompts.ts`:

| Round | Persona | Voice | Focus |
|-------|---------|-------|-------|
| HR | Sarah Chen | sage | Motivation, cultural fit, soft skills |
| Technical | Marcus Rivera | cove | Fundamentals, resume verification, adaptive difficulty |
| Coding | Jordan Park | ember | Pair programming, supportive hints |

### Voice API Integration

The XAI Realtime API connection flow:
1. `use-interview-voice.ts`: Manages WebSocket lifecycle
2. `use-interview-audio.ts`: Captures mic input, plays audio responses
3. `/api/interview/session`: Creates ephemeral tokens, builds context-aware prompts
4. Audio is sent/received as base64 PCM16 (see `audio-utils.ts`)

### Cross-Round Context (Pipeline Handoffs)

Each round generates handoff context for subsequent rounds:

```
HR Round → [Handoff] → Technical Round → [Handoff] → Coding Round
```

**Key files:**
- `lib/round-handoff.ts`: Types and handoff generation using Grok 4.1
- `hooks/use-round-handoff.ts`: Client hook for generating handoffs
- `api/interview/handoff/route.ts`: API for saving/retrieving handoffs

**What's passed between rounds:**
- Topics discussed (for conversation continuity)
- Candidate claims (for verification in technical round)
- Areas to explore (topics needing more depth)
- Positive signals (for building rapport)
- Discussion points (specific things to reference naturally)

**What's NOT passed (to avoid bias):**
- Raw scores or ratings
- "Red flag" labels
- Hire/no-hire recommendations

The Technical and Coding round prompts receive formatted context from previous rounds.

### State Management

- **In-Memory Store** (`lib/store.ts`): Holds candidates, interviews, jobs during development
- **localStorage**: Persists candidate data client-side for demo purposes
- **No database yet**: Replace `store.ts` with actual DB for production

### Interview Types (`lib/types.ts`)

Core interfaces:
- `Candidate`: Resume data, job association, status
- `InterviewSession`: Multi-round container with transcript storage
- `RoundResult`: Scores, transcripts, competency breakdown
- `AIInsights`: Strengths, red flags, hire recommendation

## Environment Variables

Required in `.env.local`:
```
XAI_API_KEY=your_xai_api_key
```

## Patterns

### API Routes
All API routes use Next.js App Router conventions with `route.ts` files.

### Component Organization
UI primitives in `components/ui/` follow shadcn patterns (Radix + CVA). Feature components are co-located by domain (`dashboard/`, `coding/`, `interview/`).

### Client/Server Split
- Pages are server components by default
- Interactive components (voice, camera, Monaco) use `"use client"`
- API routes handle XAI communication server-side to protect API keys
