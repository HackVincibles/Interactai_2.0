# Interview Platform - Complete Project Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Core Data Flow](#core-data-flow)
3. [Technologies Used](#technologies-used)
4. [How to Run the Project](#how-to-run-the-project)
5. [Project Architecture](#project-architecture)
6. [Key Files Reference](#key-files-reference)
7. [Voice API Integration](#voice-api-integration)
8. [Cross-Round Context & Handoff](#cross-round-context--handoff)
9. [Interview Types](#interview-types)
10. [API Routes](#api-routes)
11. [State Management](#state-management)
12. [Component Organization](#component-organization)

---

## Project Overview

This is an **AI-powered interview platform** that stitches together HR, technical, and coding rounds with a shared context. Candidates speak with distinct interviewer personas over voice, tackle live coding prompts in a Monaco IDE, and finish with automatically generated scorecards.

### Key Features
- ✅ Multi-round voice interviews with XAI's realtime API
- ✅ Monaco-based coding workspace with live test runner
- ✅ Dashboard for candidate management and reporting
- ✅ Voice-to-text transcription and analysis
- ✅ Python code execution in WebAssembly (Pyodide)
- ✅ Automatic handoff of context between interview rounds

---

## Core Data Flow

The interview platform operates through a multi-stage pipeline:

```
Candidate Created → Interview Session → Multi-Round Voice Interviews → AI Analysis → Scorecard
           ↓                    ↓                      ↓                      ↓
    Resume Parsing      Session Token         Voice Connection          Scoring &
  (via /api/resume)   (via /api/interview)   (XAI WebSocket)       Competency Analysis
```

### Complete Flow Breakdown

1. **Candidate Onboarding** 
   - Candidate data uploaded via `/dashboard/candidates`
   - Resume parsed via `/api/resume/parse` (DOCX/PDF extraction)
   - Profile stored in Firebase Firestore

2. **Interview Initialization**
   - User navigates to `/interview/[id]`
   - System loads job requirements and candidate history
   - Round selector displays HR → Technical → Coding flow

3. **Voice Interview Round**
   - Client calls `/api/interview/session` to get ephemeral XAI token
   - Context from previous rounds injected into system prompt
   - WebSocket connection established via `use-interview-voice.ts`
   - Candidate speaks with AI interviewer persona
   - Real-time audio conversion: PCM16 ↔ Float32 (via `audio-utils.ts`)

4. **Round Completion**
   - Transcript saved to Firestore
   - Context extracted via `use-round-handoff.ts`
   - Handoff data prepared for next round
   - `/api/interview/handoff` stores context (topics, claims, insights, NOT scores)

5. **Post-Interview Analysis**
   - `/api/interview/analyze` runs Grok 4.1 analysis
   - Competency scores generated
   - Scorecard created with strengths/weaknesses
   - Results stored in `store.ts` (in-memory) or Firebase

---

## Folder Structure

```
Interactai_2.0/
│
├── src/
│   ├── app/
│   │   ├── api/                          # Backend API routes
│   │   │   ├── candidates/               # Candidate management APIs
│   │   │   ├── coding/                   # Coding evaluation APIs
│   │   │   ├── interview/                # Interview session APIs
│   │   │   ├── interviews/               # Interview retrieval APIs
│   │   │   ├── jobs/                     # Job management APIs
│   │   │   ├── mock-packs/               # Mock interview packs
│   │   │   ├── resume/                   # Resume parsing APIs
│   │   │   └── wallet/                   # Payment/wallet APIs
│   │   │
│   │   ├── dashboard/                    # Dashboard pages
│   │   │   ├── candidates/               # Candidate list and details
│   │   │   ├── interviews/               # Interview management
│   │   │   ├── jobs/                     # Job postings
│   │   │   ├── profile/                  # User profile
│   │   │   ├── reports/                  # Interview reports
│   │   │   ├── settings/                 # Settings pages
│   │   │   ├── subscription/             # Subscription management
│   │   │   ├── layout.tsx                # Dashboard layout
│   │   │   └── page.tsx                  # Dashboard home
│   │   │
│   │   ├── interview/                    # Interview pages
│   │   │   └── [id]/                     # Dynamic interview routes
│   │   │       ├── coding/               # Coding round page
│   │   │       ├── hr/                   # HR round page
│   │   │       ├── technical/            # Technical round page
│   │   │       └── practice/             # Practice round page
│   │   │
│   │   ├── login/                        # Login page
│   │   ├── practice/                     # Practice mode page
│   │   ├── globals.css                   # Global styles
│   │   ├── layout.tsx                    # Root layout
│   │   └── page.tsx                      # Home page
│   │
│   ├── components/
│   │   ├── coding/                       # Coding-related components
│   │   │   ├── coding-timer.tsx          # Interview timer
│   │   │   ├── draggable-camera.tsx      # Camera window
│   │   │   ├── help-button.tsx           # Help interface
│   │   │   ├── ide-tabs.tsx              # Editor tabs
│   │   │   ├── language-selector.tsx     # Programming language selector
│   │   │   ├── monaco-editor.tsx         # Code editor wrapper
│   │   │   ├── problem-panel.tsx         # Problem statement panel
│   │   │   ├── test-runner.tsx           # Test execution UI
│   │   │   └── transcript-panel.tsx      # Interview transcript
│   │   │
│   │   ├── dashboard/                    # Dashboard components
│   │   │   ├── activity-feed.tsx         # Activity log component
│   │   │   ├── candidate-scorecard.tsx   # Candidate scores
│   │   │   ├── candidate-table.tsx       # Candidates list table
│   │   │   ├── interview-pipeline.tsx    # Interview workflow visualization
│   │   │   ├── interview-table.tsx       # Interviews list table
│   │   │   ├── job-form.tsx              # Job creation/edit form
│   │   │   ├── round-progress.tsx        # Round completion progress
│   │   │   ├── score-radar.tsx           # Skills radar chart
│   │   │   └── stats-cards.tsx           # KPI cards
│   │   │
│   │   ├── interview/                    # Interview components
│   │   │   └── media-panel.tsx           # Audio/video controls
│   │   │
│   │   ├── layout/                       # Layout components
│   │   │   ├── navbar.tsx                # Top navigation bar
│   │   │   └── sidebar.tsx               # Side navigation
│   │   │
│   │   └── ui/                           # Reusable UI components
│   │       ├── alert.tsx                 # Alert dialogs
│   │       ├── avatar.tsx                # User avatars
│   │       ├── badge.tsx                 # Badge labels
│   │       ├── button.tsx                # Button component
│   │       ├── card.tsx                  # Card container
│   │       ├── chart.tsx                 # Chart wrapper
│   │       ├── dialog.tsx                # Modal dialogs
│   │       ├── dropdown-menu.tsx         # Dropdown menus
│   │       ├── input.tsx                 # Input fields
│   │       ├── label.tsx                 # Form labels
│   │       ├── popover.tsx               # Popover components
│   │       ├── profile-dropdown.tsx      # Profile menu
│   │       ├── progress.tsx              # Progress bars
│   │       ├── scroll-area.tsx           # Scrollable areas
│   │       ├── select.tsx                # Select dropdowns
│   │       ├── separator.tsx             # Divider lines
│   │       ├── skeleton.tsx              # Loading skeletons
│   │       ├── switch.tsx                # Toggle switches
│   │       ├── table.tsx                 # Data tables
│   │       ├── tabs.tsx                  # Tab navigation
│   │       └── tooltip.tsx               # Tooltip hints
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── use-client-vad.ts             # Voice activity detection
│   │   ├── use-code-analysis.ts          # Code quality analysis
│   │   ├── use-coding-events.ts          # Coding telemetry tracking
│   │   ├── use-coding-voice.ts           # Voice in coding rounds
│   │   ├── use-idle-timer.ts             # Activity timeout tracking
│   │   ├── use-interview-audio.ts        # Audio stream management
│   │   ├── use-interview-voice.ts        # Voice interview lifecycle
│   │   ├── use-python-runner.ts          # Python code execution
│   │   └── use-round-handoff.ts          # Context between rounds
│   │
│   └── lib/                              # Utilities and helpers
│       ├── audio-utils.ts                # Audio processing (PCM16↔Float32)
│       ├── code-analysis-types.ts        # Type definitions for code analysis
│       ├── code-execution-types.ts       # Type definitions for execution
│       ├── coding-events.ts              # Coding event tracking
│       ├── coding-problems.ts            # Problem database and test cases
│       ├── firebase-admin.ts             # Firebase admin SDK setup
│       ├── firebase-client.ts            # Firebase client SDK setup
│       ├── firebase.ts                   # Firebase configuration
│       ├── firestore-service.ts          # Firestore database operations
│       ├── interview-prompts.ts          # AI prompt templates
│       ├── python-worker.ts              # Python execution worker
│       ├── round-handoff.ts              # Context passing between rounds
│       ├── store.ts                      # In-memory data store
│       ├── types.ts                      # Global TypeScript types
│       └── utils.ts                      # Helper functions
│
├── public/
│   └── python-worker.js                  # Python execution web worker
│
├── docs/
│   └── client-vad-implementation.md      # Voice detection documentation
│
├── Configuration Files
│   ├── package.json                      # Dependencies & scripts
│   ├── tsconfig.json                     # TypeScript configuration
│   ├── next.config.ts                    # Next.js configuration
│   ├── tailwind.config.ts                # Tailwind CSS configuration
│   ├── postcss.config.mjs                # PostCSS configuration
│   ├── eslint.config.mjs                 # ESLint rules
│   ├── components.json                   # UI component metadata
│   ├── .env.local                        # Environment variables (local)
│   ├── .gitignore                        # Git ignore rules
│   └── CLAUDE.md                         # Codebase documentation
│
├── .vscode/                              # VS Code settings
├── .git/                                 # Git repository
├── node_modules/                         # Dependencies (not in repo)
├── package-lock.json                     # Dependency lock file
└── README.md                             # Project README
```

---

## Technologies Used

### 🎯 Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.7 | React framework with App Router |
| **React** | 19.2.0 | UI library |
| **React DOM** | 19.2.0 | React rendering engine |
| **TypeScript** | 5 | Type-safe JavaScript |
| **Node.js** | 18+ | Runtime environment |

### 🎨 UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **Radix UI** | Latest | Unstyled, accessible components |
| **Lucide React** | 0.556.0 | Icon library |
| **Class Variance Authority** | 0.7.1 | CSS-in-JS utility |
| **clsx** | 2.1.1 | Class composition |
| **Tailwind Merge** | 3.4.0 | Merge Tailwind classes |

**Radix UI Components Used:**
- Dialog, Dropdown Menu, Select, Tabs, Tooltip, Progress, Switch, Avatar, Label, Popover, Scroll Area, Separator

### 💻 Code Editing & Execution
| Technology | Version | Purpose |
|------------|---------|---------|
| **Monaco Editor** | 4.7.0 | VS Code editor component |
| **Pyodide** | 0.29.0 | Python in WebAssembly |
| **Python Worker** | - | Code execution web worker |

### 🤖 AI & Voice
| Technology | Version | Purpose |
|------------|---------|---------|
| **XAI API** | - | AI voice interview assistant |
| **Mastra Core** | 0.24.6 | AI orchestration framework |
| **Mastra LibSQL** | 0.16.3 | Database integration |
| **Mastra Memory** | 0.15.12 | Conversation memory management |

### 🗄️ Backend & Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **Firebase** | 12.16.0 | Authentication & real-time DB |
| **Firebase Admin** | 14.2.0 | Server-side operations |
| **LibSQL** | Latest | SQL database |
| **Firestore** | Built-in | NoSQL database |

### 📊 Data Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | 2.15.4 | React charting library |
| **TanStack React Table** | 8.21.3 | Headless table/data grid |

### 📄 Document Processing
| Technology | Version | Purpose |
|------------|---------|---------|
| **Mammoth** | 1.11.0 | DOCX to HTML conversion |
| **UnPDF** | 1.4.0 | PDF parsing |

### 🔧 Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9 | Code linting |
| **PostCSS** | 4 | CSS processing |
| **Tailwind CSS PostCSS** | 4 | Tailwind integration |

---

## How to Run the Project

### Prerequisites
- **Node.js** 18+ 
- **npm** 9+ (or yarn/pnpm/bun)
- **XAI_API_KEY** - Get from XAI platform
- **Firebase credentials** - Already configured in `.env.local`

### Quick Start

#### 1️⃣ Install Dependencies
```bash
npm install
```

#### 2️⃣ Configure Environment Variables
Your `.env.local` is already set up with:
- ✅ `XAI_API_KEY` - For voice interviews
- ✅ Firebase credentials - For authentication & database

No additional configuration needed!

#### 3️⃣ Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

#### 4️⃣ Open in Browser
- **Home Page:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **Interview Mode:** http://localhost:3000/interview/[id]
- **Practice Mode:** http://localhost:3000/practice
- **Login:** http://localhost:3000/login

### Available Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

### Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev -- -p 3001
```

**Dependencies issues?**
```bash
rm -r node_modules package-lock.json
npm install
```

**Firebase connection issues?**
- Verify `.env.local` has correct Firebase credentials
- Check internet connection
- Ensure Firebase project is active

---

## Project Architecture

### Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Frontend (React Components)                     │
│  Pages: dashboard/*, interview/*/*, login/*, practice/ │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│       Custom Hooks & State Management                   │
│  use-interview-voice, use-coding-events, etc.          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│        Next.js API Routes (/api/*)                      │
│  Session mgmt, Resume parsing, Analysis, Handoff       │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│      External Services & Database                       │
│  XAI Voice API, Firebase, Firestore, Mastra            │
└─────────────────────────────────────────────────────────┘
```

### Key Workflows

#### 1. Interview Flow
```
Login → Dashboard → Select Job → Start Interview 
  ↓                                   ↓
HR Round → Technical Round → Coding Round → Scorecard
```

#### 2. Voice Session Workflow
```
use-interview-voice → /api/interview/session → XAI WebSocket
     ↓
use-interview-audio ← Audio Stream ← XAI Response
     ↓
Transcript saved → use-round-handoff → Next round context
```

#### 3. Coding Round Workflow
```
Load Problem → Select Language → Write Code → Run Tests
              ↓
        Pyodide Execution → Results → Submit → Scoring
```

### Component Hierarchy

```
App (layout.tsx)
├── Navbar (logo, user menu)
├── Sidebar (navigation)
└── Page Content
    ├── Dashboard/
    │   ├── StatsCards (KPI metrics)
    │   ├── InterviewPipeline (visual workflow)
    │   ├── CandidateTable (searchable list)
    │   ├── InterviewTable (history)
    │   └── ActivityFeed (recent events)
    │
    └── Interview/[id]/
        ├── MediaPanel (audio controls, timer)
        ├── CodingEditor (Monaco IDE)
        │   ├── LanguageSelector
        │   ├── ProblemPanel
        │   ├── TestRunner
        │   └── TranscriptPanel
        └── Navbar (round indicator)

---

## Key Files Reference

### Critical Files for Development

| File | Purpose | Priority |
|------|---------|----------|
| `src/lib/types.ts` | Core TypeScript interfaces & types | 🔴 Critical |
| `src/lib/interview-prompts.ts` | AI persona prompts for each round | 🔴 Critical |
| `src/lib/round-handoff.ts` | Context passing between rounds | 🔴 Critical |
| `src/lib/store.ts` | In-memory data store | 🟠 High |
| `src/hooks/use-interview-voice.ts` | XAI WebSocket connection | 🔴 Critical |
| `src/hooks/use-interview-audio.ts` | Audio stream management | 🔴 Critical |
| `src/app/api/interview/session/route.ts` | Session token generation | 🔴 Critical |
| `src/app/api/interview/analyze/route.ts` | Post-interview scoring | 🟠 High |
| `src/lib/audio-utils.ts` | PCM16 ↔ Float32 conversion | 🟠 High |
| `src/lib/coding-problems.ts` | Problem set & test cases | 🟠 High |
| `src/components/coding/monaco-editor.tsx` | Code editor UI wrapper | 🟠 High |

### Quick Edit Checklist

- **Change AI persona:** Edit `src/lib/interview-prompts.ts`
- **Add coding problems:** Update `src/lib/coding-problems.ts`
- **Modify rounds flow:** Check `src/app/interview/[id]/`
- **Update scoring logic:** Edit `src/app/api/interview/analyze/route.ts`
- **Add new UI component:** Follow pattern in `src/components/ui/`

---

## Voice API Integration

### XAI Realtime API Flow

The platform uses XAI's Grok realtime voice API for conducting interviews:

```
┌──────────────────────┐
│   Candidate Speaks   │
│   (Microphone)       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  use-interview-audio.ts              │
│  • Capture PCM16 audio               │
│  • Convert to Float32 chunks         │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  use-interview-voice.ts              │
│  • Manage WebSocket connection       │
│  • Send audio to XAI                 │
│  • Receive audio response            │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  /api/interview/session              │
│  • Generate ephemeral XAI token      │
│  • Inject context & system prompt    │
│  • Provide interview persona         │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  XAI Grok Realtime API               │
│  • Process candidate speech          │
│  • Generate contextual responses     │
│  • Return audio stream               │
└──────────────────────────────────────┘
```

### Interview Personas

| Round | Persona | Focus | Characteristics |
|-------|---------|-------|-----------------|
| **HR** | Sarah Chen | Soft skills, motivation, cultural fit | Warm, empathetic, relationship-building |
| **Technical** | Marcus Rivera | Fundamentals, architecture, problem-solving | Direct, detail-oriented, adaptive difficulty |
| **Coding** | Jordan Park | Pair programming, supportive mentoring | Encouraging, hints-based, collaborative |

### Audio Processing

- **Input:** PCM16 (16-bit, mono, 16kHz) from microphone
- **Conversion:** `audio-utils.ts` handles PCM16 ↔ Float32 conversion
- **Output:** Float32 audio chunks sent to WebSocket
- **Response:** Audio from XAI played via Web Audio API

### Environment Requirements

```env
XAI_API_KEY=your_xai_api_key_here
```

**Note:** API key is server-side only (never exposed to client)

---

## Cross-Round Context & Handoff

### How Handoff Works

The platform maintains conversation context across multiple interview rounds without biasing future assessments:

```
HR Round (Discussion)
    ↓
use-round-handoff.ts → Extract Context
    ↓
/api/interview/handoff → Store Context
    ↓
Technical Round (Verification)
    ↓
use-round-handoff.ts → Extract Context
    ↓
Coding Round (Execution)
```

### What Gets Passed Between Rounds

✅ **Passed (Unbiased Context):**
- Topics discussed (for conversation continuity)
- Candidate claims and assertions (for verification)
- Areas flagged for deeper exploration
- Positive signals and achievements mentioned
- Technical terms and context introduced

❌ **NOT Passed (Prevent Bias):**
- Raw scores or ratings
- "Red flag" labels
- Hire/no-hire recommendations
- Subjective evaluations

### Handoff Data Structure

```typescript
interface RoundHandoff {
  roundId: string
  fromRound: 'hr' | 'technical' | 'coding'
  toRound: 'technical' | 'coding'
  discussionTopics: string[]
  candidateClaims: string[]
  areasToExplore: string[]
  positiveSignals: string[]
  discussionPoints: string[]
  timestamp: Date
}
```

### Implementation Files

- `src/lib/round-handoff.ts` - Types & handoff generation
- `src/hooks/use-round-handoff.ts` - Client hook for extraction
- `src/app/api/interview/handoff/route.ts` - Server-side persistence

---

## Interview Types

### Core TypeScript Interfaces (`src/lib/types.ts`)

```typescript
interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  jobId: string
  resumeUrl: string
  parsedResume: {
    skills: string[]
    experience: string
    education: string
  }
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected'
  createdAt: Date
}

interface InterviewSession {
  id: string
  candidateId: string
  jobId: string
  rounds: RoundResult[]
  status: 'pending' | 'in-progress' | 'completed'
  startedAt: Date
  completedAt?: Date
  overallScore?: number
  handoffs: RoundHandoff[]
}

interface RoundResult {
  roundId: string
  roundType: 'hr' | 'technical' | 'coding'
  transcript: string
  duration: number
  score: number
  competencies: CompetencyScore[]
  audioUrl?: string
  status: 'pending' | 'in-progress' | 'completed'
  startedAt: Date
  completedAt?: Date
}

interface CompetencyScore {
  category: string
  score: number
  evidence: string[]
  level: 'junior' | 'mid' | 'senior' | 'expert'
}

interface AIInsights {
  strengths: string[]
  weaknesses: string[]
  redFlags: string[]
  recommendation: 'strong-yes' | 'yes' | 'maybe' | 'no'
  nextSteps: string[]
  summary: string
}
```

---

## API Routes

### Route Organization

```
src/app/api/
├── candidates/
│   ├── route.ts          [GET] List candidates | [POST] Create
│   ├── [id]/route.ts     [GET] Get | [PUT] Update | [DELETE]
│   └── [id]/scores/route.ts  [GET] Candidate scores
│
├── interview/
│   ├── session/route.ts     [POST] Get XAI session token
│   ├── analyze/route.ts     [POST] Analyze completed round
│   ├── handoff/route.ts     [POST] Save round handoff context
│   ├── transcript/route.ts  [GET/POST] Manage transcripts
│   └── [id]/route.ts        [GET] Interview details
│
├── interviews/
│   ├── route.ts          [GET] List all interviews
│   └── [id]/route.ts     [GET] Interview history
│
├── resume/
│   └── parse/route.ts    [POST] Extract resume data (DOCX/PDF)
│
├── coding/
│   ├── route.ts          [GET] List problems
│   ├── test/route.ts     [POST] Execute code & run tests
│   └── [id]/route.ts     [GET] Specific problem
│
├── jobs/
│   ├── route.ts          [GET] List | [POST] Create
│   └── [id]/route.ts     [GET] Details | [PUT] Update
│
└── wallet/
    ├── balance/route.ts  [GET] Get user balance
    └── charge/route.ts   [POST] Deduct interview cost
```

### Critical API Endpoints

#### Session Generation
```typescript
POST /api/interview/session
Body: {
  candidateId: string
  jobId: string
  roundType: 'hr' | 'technical' | 'coding'
  previousRoundHandoff?: RoundHandoff
}
Response: {
  token: string
  expiresIn: number
  instructions: string
}
```

#### Resume Parsing
```typescript
POST /api/resume/parse
Body: FormData with file (PDF/DOCX)
Response: {
  name: string
  email: string
  skills: string[]
  experience: string
  education: string
}
```

#### Round Analysis
```typescript
POST /api/interview/analyze
Body: {
  interviewSessionId: string
  roundId: string
  transcript: string
}
Response: {
  competencyScores: CompetencyScore[]
  overallScore: number
  insights: AIInsights
}
```

---

## State Management

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│        Component State (React)              │
│   useState, useContext, useReducer          │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│    Custom Hooks (use-* pattern)             │
│   use-interview-voice, use-coding-events    │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│    Session Store (lib/store.ts)             │
│   In-memory cache of interview data         │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│   Firebase & Firestore                      │
│   Persistent data storage                   │
└─────────────────────────────────────────────┘
```

### Storage Layers

| Layer | Technology | Purpose | Lifespan |
|-------|-----------|---------|----------|
| **Component** | React useState | UI state | Session only |
| **Session** | lib/store.ts | Interview data | Current session |
| **Browser** | localStorage | Candidate preferences | Persistent (local) |
| **Backend** | Firebase Firestore | Production data | Permanent |
| **Memory** | Mastra Memory | Conversation context | Round only |

### Store Structure (`lib/store.ts`)

```typescript
interface AppStore {
  candidates: Map<string, Candidate>
  interviews: Map<string, InterviewSession>
  jobs: Map<string, Job>
  currentSession?: InterviewSession
  userPreferences: UserPreferences
}
```

**Important:** Replace `store.ts` with actual database before production deployment.

---

## Component Organization

### Pattern: Feature-Based Organization

Components are organized by feature domain, not by type:

```
components/
├── coding/          # Coding interview features
│   ├── monaco-editor.tsx      # Main editor component
│   ├── problem-panel.tsx      # Problem description
│   ├── test-runner.tsx        # Test execution UI
│   ├── language-selector.tsx  # Language picker
│   ├── coding-timer.tsx       # Round timer
│   ├── transcript-panel.tsx   # Interview transcript
│   ├── help-button.tsx        # Help interface
│   ├── ide-tabs.tsx           # Tab management
│   └── draggable-camera.tsx   # Video feed
│
├── dashboard/       # Dashboard features
│   ├── stats-cards.tsx        # KPI cards
│   ├── interview-pipeline.tsx # Workflow visualization
│   ├── candidate-table.tsx    # Candidate list
│   ├── interview-table.tsx    # Interview history
│   ├── candidate-scorecard.tsx # Score display
│   ├── score-radar.tsx        # Skills visualization
│   ├── round-progress.tsx     # Progress indicator
│   ├── activity-feed.tsx      # Recent events
│   └── job-form.tsx           # Job creation
│
├── interview/       # Interview-specific
│   └── media-panel.tsx        # Audio/video controls
│
├── layout/          # Layout components
│   ├── navbar.tsx             # Top navigation
│   └── sidebar.tsx            # Side navigation
│
└── ui/              # Reusable primitives
    ├── button.tsx             # Radix + CVA
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── select.tsx
    ├── table.tsx
    └── ... (other Radix-based components)
```

### Component Development Rules

#### ✅ Best Practices

1. **Use `"use client"` for interactive components**
   - Pages are server components by default
   - Only make components client-side if they need interactivity

2. **Follow shadcn/Radix pattern for UI components**
   - Use Radix UI for accessibility
   - Apply CVA (Class Variance Authority) for styling
   - Export both component and primitive

3. **Co-locate related components**
   - Keep codec editor, problem panel, and test runner together
   - Group dashboard widgets

4. **Export compound components**
   ```tsx
   export const CodingEditor = {
     Root: CodingEditorRoot,
     Tabs: CodingEditorTabs,
     Panel: CodingEditorPanel,
   }
   ```

5. **Use TypeScript strict mode**
   - Define prop interfaces explicitly
   - Export component types for consumers

#### ❌ Avoid

- Mixing business logic with UI rendering
- Deep nesting of components (max 3 levels)
- Prop drilling (use context or hooks instead)
- Unrelated components in same file

### Styling Convention

```typescript
// ✅ Correct: CVA + Tailwind
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "px-4 py-2 rounded font-semibold",
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white",
        secondary: "bg-gray-200 text-black"
      }
    }
  }
)

export function Button({ variant = "primary", ...props }) {
  return <button className={buttonVariants({ variant })} {...props} />
}

// ✅ Usage
<Button variant="primary">Click me</Button>
```

### File Naming Conventions

- **Components:** `PascalCase.tsx` → `CodingTimer.tsx`
- **Hooks:** `use-kebab-case.ts` → `use-interview-voice.ts`
- **Utils:** `kebab-case.ts` → `audio-utils.ts`
- **API routes:** `kebab-case` → `/api/interview/session`
- **Types:** `kebab-case.ts` → `code-analysis-types.ts`

---

## Development Guidelines

### Adding a New Feature

1. **Create component:**
   ```bash
   # Create in appropriate feature folder
   src/components/[feature]/my-component.tsx
   ```

2. **Add custom hook if needed:**
   ```bash
   src/hooks/use-my-feature.ts
   ```

3. **Create API route if needed:**
   ```bash
   src/app/api/[endpoint]/route.ts
   ```

4. **Update types:**
   ```bash
   src/lib/types.ts  # Add interfaces
   ```

5. **Style with Tailwind:**
   - Use Tailwind classes for styling
   - Extract repeated patterns into CVA variants

6. **Export and use:**
   ```tsx
   import { MyComponent } from "@/components/[feature]/my-component"
   ```

### Debugging Tips

**Voice Interview Issues:**
- Check XAI_API_KEY in `.env.local`
- Monitor WebSocket connection in browser DevTools
- Check audio permissions in browser
- Review console for API errors

**Coding Round Issues:**
- Verify Pyodide loads correctly (check Network tab)
- Test Python code in browser console first
- Check `use-python-runner.ts` for execution errors

**Dashboard Issues:**
- Verify Firebase connection (`lib/firebase-client.ts`)
- Check Firestore rules allow access
- Review `lib/store.ts` for data structure mismatches

**General:**
- Use `console.log()` in hooks to trace state changes
- Check browser DevTools → Network tab for API calls
- Use Firefox/Chrome DevTools for component inspection

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Run dev server: `npm run dev`
3. ✅ Visit http://localhost:3000
4. 📖 Read `README.md` for more details
5. 🔍 Explore API routes in `src/app/api/`
6. 🎨 Customize UI components in `src/components/ui/`
7. 🎤 Test voice interviews with proper XAI_API_KEY
8. 💻 Add new coding problems to `lib/coding-problems.ts`

---

**Created:** 2026-08-18
**Last Updated:** 2026-08-18
**Project Status:** Active Development
**Maintained by:** Interact AI Team
