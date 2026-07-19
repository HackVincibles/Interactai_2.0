import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore, collection, DocumentData, CollectionReference } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export { app, auth, db, storage, googleProvider, githubProvider };

// ==========================================
// FIRESTORE SCHEMA TYPES & TYPED COLLECTIONS
// ==========================================

export interface UserDocument {
  name: string;
  email: string;
  role: "admin" | "recruiter" | "candidate";
  walletBalance: number; // In Rupees
  companyName?: string; // Optional, for recruiters
  isApprovedByAdmin: boolean; // default: false for recruiters
  createdAt: any; // timestamp
}

export interface MockPackDocument {
  title: string;
  companyTheme: string;
  difficulty: "Easy" | "Medium" | "Hard";
  price: number; // Rupees
  durationMinutes: number;
  aiPersonaPrompt: string;
  isActive: boolean;
  createdBy: string; // admin_uid
}

export interface JobDocument {
  recruiterId: string; // ref: users
  title: string;
  description: string;
  aiPersonaPrompt: string;
  screeningCostPerCandidate: number; // Recruiter pays this per call
  autoRejectScore: number;
  status: "open" | "closed" | "archived";
  createdAt: any; // timestamp
}

export interface InterviewDocument {
  candidateId: string; // ref: users
  type: "hiring" | "mock";
  // For Hiring:
  jobId?: string;
  recruiterId?: string;
  // For Mock:
  mockPackId?: string;
  // Shared:
  status: "scheduled" | "in-progress" | "completed" | "failed";
  costToPlatform: number; // What Grok/Vapi charged me
  revenueCollected: number; // What customer paid
  finalScore: number;
  scheduledTime: any; // timestamp
  createdAt: any; // timestamp
}

export interface TranscriptDocument {
  speaker: "ai" | "candidate";
  text: string;
  timestamp: any; // timestamp
}

// Helper to create typed collections
const createCollection = <T = DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

export const collections = {
  users: createCollection<UserDocument>("users"),
  mockPacks: createCollection<MockPackDocument>("mock_packs"),
  jobs: createCollection<JobDocument>("jobs"),
  interviews: createCollection<InterviewDocument>("interviews"),
  // transcripts are a sub-collection, we usually get them via a helper function:
  getTranscriptsCollection: (interviewId: string) => 
    collection(db, `interviews/${interviewId}/transcripts`) as CollectionReference<TranscriptDocument>,
};
