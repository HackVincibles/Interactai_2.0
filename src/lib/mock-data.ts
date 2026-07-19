import { Candidate, InterviewRoundConfig, InterviewSession, Job, RoundResult, CompetencyScores, AIInsights } from "./types";

const sampleTranscript: RoundResult["transcript"] = [
  { timestamp: new Date().toISOString(), role: "assistant", content: "Welcome! Tell me about yourself." },
  { timestamp: new Date().toISOString(), role: "candidate", content: "I'm a backend engineer with 5 years in Node and Python." },
];

const hrTranscript: RoundResult["transcript"] = [
  { timestamp: new Date(Date.now() - 3600000).toISOString(), role: "assistant", content: "Welcome! Let's start with your background." },
  { timestamp: new Date(Date.now() - 3500000).toISOString(), role: "candidate", content: "I'm a backend engineer with 5 years of experience building scalable systems at scale." },
  { timestamp: new Date(Date.now() - 3400000).toISOString(), role: "assistant", content: "What attracted you to this role?" },
  { timestamp: new Date(Date.now() - 3300000).toISOString(), role: "candidate", content: "I'm excited about working with AI-first infrastructure and Grok's innovative approach." },
];

const technicalTranscript: RoundResult["transcript"] = [
  { timestamp: new Date(Date.now() - 1800000).toISOString(), role: "assistant", content: "Explain the difference between SQL and NoSQL databases." },
  { timestamp: new Date(Date.now() - 1700000).toISOString(), role: "candidate", content: "SQL databases are relational and use structured schemas, while NoSQL offers flexibility for unstructured data." },
  { timestamp: new Date(Date.now() - 1600000).toISOString(), role: "assistant", content: "How would you design a URL shortener?" },
  { timestamp: new Date(Date.now() - 1500000).toISOString(), role: "candidate", content: "I'd use a hash function to generate short codes, store mappings in Redis for fast lookups, and use a database for persistence." },
];

export const jobs: Job[] = [
  {
    id: "job-1",
    title: "Senior Backend Engineer",
    company: "Grok Labs",
    description: "Build scalable AI-first services and developer tooling.",
    requirements: ["Node.js", "Python", "PostgreSQL", "Cloud (AWS/GCP)", "Realtime systems"],
    interviewConfig: {
      hrDuration: 5,
      technicalDuration: 5,
      codingEnabled: true,
      codingDuration: 10,
    },
  },
  {
    id: "job-2",
    title: "Fullstack Engineer",
    company: "NeoVoice",
    description: "Ship user-facing voice-first experiences with Grok APIs.",
    requirements: ["React/Next.js", "TypeScript", "WebRTC", "Tailwind", "Vercel"],
    interviewConfig: {
      hrDuration: 5,
      technicalDuration: 5,
      codingEnabled: true,
      codingDuration: 10,
    },
  },
  {
    id: "job-3",
    title: "ML Engineer",
    company: "AI Systems Inc",
    description: "Design and implement machine learning pipelines for production.",
    requirements: ["Python", "TensorFlow", "PyTorch", "MLOps", "Kubernetes"],
    interviewConfig: {
      hrDuration: 5,
      technicalDuration: 5,
      codingEnabled: true,
      codingDuration: 10,
    },
  },
];

export const candidates: Candidate[] = [
  {
    id: "cand-1",
    name: "Ava Thompson",
    email: "ava.thompson@example.com",
    phone: "+1 (555) 123-4567",
    resumeUrl: "https://example.com/resume/ava.pdf",
    resumeSummary: `**Ava Thompson** - Backend Engineer with 5 years experience
- Currently: Senior Backend Developer at TechCorp (2 years)
- Previously: Software Engineer at StartupXYZ (3 years)
- Education: BS Computer Science, Stanford University
- Key Skills: Node.js, Python, PostgreSQL, AWS, Docker
- Notable: Led migration of monolith to microservices, reduced latency by 40%
- Looking for: AI-focused company, leadership growth opportunities`,
    jobId: "job-1",
    status: "in-progress",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "cand-2",
    name: "Liam Chen",
    email: "liam.chen@example.com",
    phone: "+1 (555) 234-5678",
    resumeUrl: "https://example.com/resume/liam.pdf",
    resumeSummary: `**Liam Chen** - Fullstack Developer with 4 years experience
- Currently: Frontend Engineer at WebAgency (2 years)
- Previously: Junior Developer at DigitalFirst (2 years)
- Education: BS Software Engineering, UC Berkeley
- Key Skills: React, Next.js, TypeScript, Node.js, Tailwind
- Notable: Built customer portal used by 50k+ users
- Looking for: Product-focused role, voice/AI technology`,
    jobId: "job-2",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "cand-3",
    name: "Sarah Martinez",
    email: "sarah.martinez@example.com",
    phone: "+1 (555) 345-6789",
    resumeUrl: "https://example.com/resume/sarah.pdf",
    resumeSummary: `**Sarah Martinez** - Backend Engineer with 6 years experience
- Currently: Staff Engineer at FinTech Inc (3 years)
- Previously: Backend Developer at E-Commerce Co (3 years)
- Education: MS Computer Science, MIT
- Key Skills: Python, Go, Kubernetes, PostgreSQL, Redis
- Notable: Architected payment processing handling $10M+ daily
- Looking for: Technical leadership, cutting-edge technology`,
    jobId: "job-1",
    status: "scheduled",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "cand-4",
    name: "James Wilson",
    email: "james.wilson@example.com",
    phone: "+1 (555) 456-7890",
    resumeUrl: "https://example.com/resume/james.pdf",
    resumeSummary: `**James Wilson** - ML Engineer with 4 years experience
- Currently: ML Engineer at DataScienceCo (2 years)
- Previously: Data Scientist at Analytics Corp (2 years)
- Education: PhD Machine Learning, Carnegie Mellon
- Key Skills: Python, TensorFlow, PyTorch, MLOps, Kubernetes
- Notable: Published 3 papers on transformer architectures
- Looking for: Research-oriented ML role, production ML systems`,
    jobId: "job-3",
    status: "in-progress",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "cand-5",
    name: "Emma Davis",
    email: "emma.davis@example.com",
    phone: "+1 (555) 567-8901",
    resumeUrl: "https://example.com/resume/emma.pdf",
    resumeSummary: `**Emma Davis** - Junior Developer with 1.5 years experience
- Currently: Junior Frontend Developer at SmallTech (1.5 years)
- Education: Bootcamp Graduate, General Assembly
- Key Skills: React, JavaScript, CSS, Basic Node.js
- Notable: Built internal dashboard for team of 20
- Looking for: Growth opportunity, mentorship`,
    jobId: "job-2",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "cand-6",
    name: "Michael Brown",
    email: "michael.brown@example.com",
    phone: "+1 (555) 678-9012",
    resumeUrl: "https://example.com/resume/michael.pdf",
    resumeSummary: `**Michael Brown** - Senior Backend Engineer with 7 years experience
- Currently: Principal Engineer at CloudScale (4 years)
- Previously: Senior Developer at Enterprise Corp (3 years)
- Education: BS Computer Science, Georgia Tech
- Key Skills: Node.js, Python, AWS, Terraform, PostgreSQL
- Notable: Built real-time analytics platform processing 1M events/sec
- Looking for: Startup environment, impactful work`,
    jobId: "job-1",
    status: "scheduled",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const baseRound = (overrides?: Partial<RoundResult>): RoundResult => ({
  status: "pending",
  score: 0,
  transcript: sampleTranscript,
  feedback: "Will populate after the round.",
  duration: 15,
  ...overrides,
});

export const interviews: InterviewSession[] = [
  {
    id: "int-1001",
    candidateId: "cand-1",
    jobId: "job-1",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    rounds: {
      hr: {
        ...baseRound({
          status: "completed",
          score: 78,
          transcript: hrTranscript,
          feedback: "Strong communication skills and clear motivation for the role. Demonstrates good cultural fit.",
          duration: 14,
          competencies: {
            technicalProficiency: 70,
            problemSolving: 75,
            communication: 85,
            cultureFit: 82,
          },
          insights: {
            strengths: ["Clear articulation of experience", "Strong motivation for AI work"],
            areasForGrowth: ["Could provide more specific examples"],
            redFlags: [],
            recommendation: "hire",
            confidence: 88,
          },
          highlights: [
            "I'm excited about working with AI-first infrastructure",
            "I led a team of 5 to migrate our monolith to microservices",
          ],
        }),
      },
      technical: {
        ...baseRound({
          status: "completed",
          score: 85,
          transcript: technicalTranscript,
          feedback: "Excellent technical depth. Strong understanding of system design principles.",
          duration: 18,
          competencies: {
            technicalProficiency: 88,
            problemSolving: 87,
            communication: 82,
            cultureFit: 80,
          },
          insights: {
            strengths: ["Deep system design knowledge", "Clear problem-solving approach"],
            areasForGrowth: ["Could improve on time complexity analysis"],
            redFlags: [],
            recommendation: "strong-hire",
            confidence: 92,
          },
          highlights: [
            "I'd use a hash function to generate short codes, store mappings in Redis",
            "For scalability, I would use event-driven architecture",
          ],
        }),
      },
      coding: {
        ...baseRound({
          status: "in-progress",
          score: 0,
          duration: 35,
        }),
      },
    },
    overallScore: 82,
    status: "in-progress",
    overallCompetencies: {
      technicalProficiency: 79,
      problemSolving: 81,
      communication: 84,
      cultureFit: 81,
    },
    overallInsights: {
      strengths: ["Strong technical foundation", "Excellent communication", "Good cultural fit"],
      areasForGrowth: ["Could strengthen algorithmic complexity analysis"],
      redFlags: [],
      recommendation: "strong-hire",
      confidence: 90,
    },
  },
  {
    id: "int-1002",
    candidateId: "cand-2",
    jobId: "job-2",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    rounds: {
      hr: {
        ...baseRound({
          status: "completed",
          score: 72,
          transcript: hrTranscript,
          feedback: "Good background but needs to articulate value proposition better.",
          duration: 12,
          competencies: {
            technicalProficiency: 75,
            problemSolving: 70,
            communication: 68,
            cultureFit: 75,
          },
          insights: {
            strengths: ["Relevant experience"],
            areasForGrowth: ["Communication clarity"],
            redFlags: [],
            recommendation: "maybe",
            confidence: 75,
          },
        }),
      },
      technical: {
        ...baseRound({
          status: "completed",
          score: 68,
          transcript: technicalTranscript,
          feedback: "Solid fundamentals but struggled with some advanced concepts.",
          duration: 20,
          competencies: {
            technicalProficiency: 70,
            problemSolving: 65,
            communication: 70,
            cultureFit: 72,
          },
          insights: {
            strengths: ["Good React knowledge"],
            areasForGrowth: ["System design depth", "Problem-solving approach"],
            redFlags: [],
            recommendation: "maybe",
            confidence: 72,
          },
        }),
      },
      coding: {
        ...baseRound({
          status: "completed",
          score: 75,
          transcript: sampleTranscript,
          feedback: "Clean code but took longer than expected. Good problem-solving approach.",
          duration: 32,
          competencies: {
            technicalProficiency: 78,
            problemSolving: 72,
            communication: 70,
            cultureFit: 70,
          },
          insights: {
            strengths: ["Clean code style"],
            areasForGrowth: ["Optimization skills", "Time management"],
            redFlags: [],
            recommendation: "maybe",
            confidence: 78,
          },
        }),
      },
    },
    overallScore: 72,
    status: "completed",
    overallCompetencies: {
      technicalProficiency: 74,
      problemSolving: 69,
      communication: 69,
      cultureFit: 72,
    },
    overallInsights: {
      strengths: ["Solid technical skills", "Clean coding practices"],
      areasForGrowth: ["Communication", "System design depth"],
      redFlags: [],
      recommendation: "maybe",
      confidence: 75,
    },
  },
  {
    id: "int-1003",
    candidateId: "cand-3",
    jobId: "job-1",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    rounds: {
      hr: {
        ...baseRound({
          status: "pending",
          score: 0,
        }),
      },
      technical: baseRound({ status: "pending" }),
      coding: baseRound({ status: "pending", duration: 35 }),
    },
    overallScore: 0,
    status: "scheduled",
  },
  {
    id: "int-1004",
    candidateId: "cand-4",
    jobId: "job-3",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    rounds: {
      hr: {
        ...baseRound({
          status: "completed",
          score: 90,
          transcript: hrTranscript,
          feedback: "Exceptional candidate with strong ML background and clear vision.",
          duration: 15,
          competencies: {
            technicalProficiency: 92,
            problemSolving: 88,
            communication: 90,
            cultureFit: 90,
            leadership: 85,
          },
          insights: {
            strengths: ["Deep ML expertise", "Clear career vision", "Strong leadership"],
            areasForGrowth: [],
            redFlags: [],
            recommendation: "strong-hire",
            confidence: 95,
          },
          highlights: [
            "I've published 3 papers on transformer architectures",
            "Led ML infrastructure team of 8 engineers",
          ],
        }),
      },
      technical: {
        ...baseRound({
          status: "in-progress",
          score: 0,
        }),
      },
      coding: baseRound({ status: "pending", duration: 40 }),
    },
    overallScore: 90,
    status: "in-progress",
  },
  {
    id: "int-1005",
    candidateId: "cand-5",
    jobId: "job-2",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    completedAt: new Date(Date.now() - 172800000).toISOString(),
    rounds: {
      hr: {
        ...baseRound({
          status: "completed",
          score: 65,
          transcript: hrTranscript,
          feedback: "Limited relevant experience. Communication needs improvement.",
          duration: 10,
          competencies: {
            technicalProficiency: 60,
            problemSolving: 65,
            communication: 62,
            cultureFit: 70,
          },
          insights: {
            strengths: ["Enthusiastic"],
            areasForGrowth: ["Technical depth", "Communication"],
            redFlags: ["Limited relevant experience"],
            recommendation: "no-hire",
            confidence: 80,
          },
        }),
      },
      technical: {
        ...baseRound({
          status: "completed",
          score: 58,
          transcript: technicalTranscript,
          feedback: "Struggled with fundamental concepts. Not ready for this role.",
          duration: 18,
          competencies: {
            technicalProficiency: 55,
            problemSolving: 58,
            communication: 60,
            cultureFit: 65,
          },
          insights: {
            strengths: [],
            areasForGrowth: ["All technical areas"],
            redFlags: ["Fundamental gaps in knowledge"],
            recommendation: "no-hire",
            confidence: 85,
          },
        }),
      },
      coding: {
        ...baseRound({
          status: "completed",
          score: 52,
          transcript: sampleTranscript,
          feedback: "Could not complete basic coding tasks. Significant gaps.",
          duration: 30,
          competencies: {
            technicalProficiency: 50,
            problemSolving: 52,
            communication: 58,
            cultureFit: 60,
          },
          insights: {
            strengths: [],
            areasForGrowth: ["All areas"],
            redFlags: ["Cannot complete basic tasks"],
            recommendation: "no-hire",
            confidence: 90,
          },
        }),
      },
    },
    overallScore: 58,
    status: "completed",
    overallCompetencies: {
      technicalProficiency: 55,
      problemSolving: 58,
      communication: 60,
      cultureFit: 65,
    },
    overallInsights: {
      strengths: [],
      areasForGrowth: ["All technical competencies"],
      redFlags: ["Significant technical gaps", "Not ready for role"],
      recommendation: "no-hire",
      confidence: 85,
    },
  },
  {
    id: "int-1006",
    candidateId: "cand-6",
    jobId: "job-1",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    rounds: {
      hr: baseRound({ status: "pending" }),
      technical: baseRound({ status: "pending" }),
      coding: baseRound({ status: "pending", duration: 35 }),
    },
    overallScore: 0,
    status: "scheduled",
  },
];

export const interviewRounds: InterviewRoundConfig[] = [
  {
    label: "HR Screening",
    path: "hr",
    duration: "10-15 min",
    description: "Background, motivation, and role fit.",
  },
  {
    label: "Technical",
    path: "technical",
    duration: "15-20 min",
    description: "Role-aligned technical Q&A.",
  },
  {
    label: "Coding",
    path: "coding",
    duration: "30-45 min",
    description: "Pair-programming with tests and live guidance.",
  },
];
