/**
 * In-Memory Data Store
 * Shared state for candidates and interviews across all API routes
 * In production, this would be replaced with a database
 */

import { Candidate, InterviewSession } from "./types";
import { 
  candidates as mockCandidates, 
  interviews as mockInterviews,
  jobs as mockJobs 
} from "./mock-data";

// Initialize stores with mock data
export const candidatesStore: Candidate[] = [...mockCandidates];
export const interviewsStore: InterviewSession[] = [...mockInterviews];
export const jobsStore = [...mockJobs];

/**
 * Get a candidate by ID
 */
export function getCandidate(id: string): Candidate | undefined {
  return candidatesStore.find((c) => c.id === id);
}

/**
 * Get a candidate by email (case-insensitive)
 * Email is used as the unique identifier for candidate management
 */
export function getCandidateByEmail(email: string): Candidate | undefined {
  return candidatesStore.find((c) => c.email.toLowerCase() === email.toLowerCase());
}

/**
 * Add a new candidate
 */
export function addCandidate(candidate: Candidate): void {
  candidatesStore.unshift(candidate);
}

/**
 * Get an interview by ID
 */
export function getInterview(id: string): InterviewSession | undefined {
  return interviewsStore.find((i) => i.id === id);
}

/**
 * Get interview by candidate ID
 */
export function getInterviewByCandidateId(candidateId: string): InterviewSession | undefined {
  return interviewsStore.find((i) => i.candidateId === candidateId);
}

/**
 * Add a new interview
 */
export function addInterview(interview: InterviewSession): void {
  interviewsStore.unshift(interview);
}

/**
 * Get a job by ID
 */
export function getJob(id: string) {
  return jobsStore.find((j) => j.id === id);
}

/**
 * Get all candidates
 */
export function getAllCandidates(): Candidate[] {
  return candidatesStore;
}

/**
 * Get all interviews
 */
export function getAllInterviews(): InterviewSession[] {
  return interviewsStore;
}
