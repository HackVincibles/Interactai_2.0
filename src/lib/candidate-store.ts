/**
 * Candidate Store
 * Simple in-memory store with localStorage persistence for demo
 * In production, this would use a database like PostgreSQL or Mastra's storage
 */

import { Candidate } from "./types";
import { candidates as mockCandidates } from "./mock-data";

const STORAGE_KEY = "interview-platform-candidates";

// Server-side store (in-memory)
let serverCandidates: Candidate[] = [...mockCandidates];

/**
 * Check if we're running in browser
 */
const isBrowser = typeof window !== "undefined";

/**
 * Get all candidates
 */
export function getCandidates(): Candidate[] {
  if (isBrowser) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load candidates from localStorage:", e);
    }
  }
  return serverCandidates;
}

/**
 * Get a single candidate by ID
 */
export function getCandidate(id: string): Candidate | undefined {
  const candidates = getCandidates();
  return candidates.find((c) => c.id === id);
}

/**
 * Add a new candidate
 */
export function addCandidate(candidate: Omit<Candidate, "id" | "createdAt">): Candidate {
  const newCandidate: Candidate = {
    ...candidate,
    id: `cand-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const candidates = getCandidates();
  candidates.unshift(newCandidate);
  saveCandidates(candidates);

  return newCandidate;
}

/**
 * Update an existing candidate
 */
export function updateCandidate(id: string, updates: Partial<Candidate>): Candidate | undefined {
  const candidates = getCandidates();
  const index = candidates.findIndex((c) => c.id === id);
  
  if (index === -1) return undefined;

  candidates[index] = { ...candidates[index], ...updates };
  saveCandidates(candidates);

  return candidates[index];
}

/**
 * Delete a candidate
 */
export function deleteCandidate(id: string): boolean {
  const candidates = getCandidates();
  const filtered = candidates.filter((c) => c.id !== id);
  
  if (filtered.length === candidates.length) return false;

  saveCandidates(filtered);
  return true;
}

/**
 * Save candidates to storage
 */
function saveCandidates(candidates: Candidate[]): void {
  serverCandidates = candidates;
  
  if (isBrowser) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
    } catch (e) {
      console.error("Failed to save candidates to localStorage:", e);
    }
  }
}

/**
 * Initialize store with mock data if empty
 */
export function initializeCandidateStore(): void {
  if (isBrowser) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockCandidates));
    }
  }
}

/**
 * Reset store to mock data
 */
export function resetCandidateStore(): void {
  saveCandidates([...mockCandidates]);
}

/**
 * Search candidates by name or email
 */
export function searchCandidates(query: string): Candidate[] {
  const candidates = getCandidates();
  const lowerQuery = query.toLowerCase();
  
  return candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get candidates by job ID
 */
export function getCandidatesByJob(jobId: string): Candidate[] {
  const candidates = getCandidates();
  return candidates.filter((c) => c.jobId === jobId);
}

/**
 * Get candidates by status
 */
export function getCandidatesByStatus(status: Candidate["status"]): Candidate[] {
  const candidates = getCandidates();
  return candidates.filter((c) => c.status === status);
}
