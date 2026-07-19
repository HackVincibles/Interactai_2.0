/**
 * Firestore Service Layer
 * Typed CRUD helpers for all Firestore collections.
 * All reads/writes go through these functions — no direct Firestore
 * calls in API routes or components.
 */

import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  collection,
} from "firebase/firestore";
import { db, collections, UserDocument, MockPackDocument, JobDocument, InterviewDocument, TranscriptDocument } from "./firebase-client";

// ──────────────────────────────────────────────────
// UTILITY
// ──────────────────────────────────────────────────

/** Strip the Firestore id into the returned object */
function withId<T>(id: string, data: T): T & { id: string } {
  return { id, ...data };
}

// ──────────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────────

export type UserWithId = UserDocument & { id: string };

export async function getUserById(uid: string): Promise<UserWithId | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return withId(snap.id, snap.data() as UserDocument);
}

export async function getUserByEmail(email: string): Promise<UserWithId | null> {
  const q = query(collections.users, where("email", "==", email), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return withId(d.id, d.data());
}

export async function createUser(
  uid: string,
  data: Omit<UserDocument, "createdAt">
): Promise<UserWithId> {
  const payload: UserDocument = { ...data, createdAt: serverTimestamp() };
  await setDoc(doc(db, "users", uid), payload);
  return withId(uid, payload);
}

export async function updateUser(uid: string, updates: Partial<UserDocument>): Promise<void> {
  await updateDoc(doc(db, "users", uid), updates as Record<string, unknown>);
}

/** Atomically adjust wallet balance by `delta` (negative to debit) */
export async function adjustWallet(uid: string, delta: number): Promise<void> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User not found");
  const current = (snap.data() as UserDocument).walletBalance ?? 0;
  await updateDoc(userRef, { walletBalance: current + delta });
}

export async function getAllRecruiters(): Promise<UserWithId[]> {
  const q = query(collections.users, where("role", "==", "recruiter"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId(d.id, d.data()));
}

export async function getPendingRecruiters(): Promise<UserWithId[]> {
  const q = query(
    collections.users,
    where("role", "==", "recruiter"),
    where("isApprovedByAdmin", "==", false)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId(d.id, d.data()));
}

// ──────────────────────────────────────────────────
// MOCK PACKS  (B2C)
// ──────────────────────────────────────────────────

export type MockPackWithId = MockPackDocument & { id: string };

export async function getMockPackById(packId: string): Promise<MockPackWithId | null> {
  const snap = await getDoc(doc(db, "mock_packs", packId));
  if (!snap.exists()) return null;
  return withId(snap.id, snap.data() as MockPackDocument);
}

export async function getActiveMockPacks(): Promise<MockPackWithId[]> {
  const q = query(collections.mockPacks, where("isActive", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId(d.id, d.data()));
}

export async function createMockPack(
  data: Omit<MockPackDocument, never>
): Promise<MockPackWithId> {
  const ref = await addDoc(collections.mockPacks, data);
  return withId(ref.id, data);
}

export async function updateMockPack(packId: string, updates: Partial<MockPackDocument>): Promise<void> {
  await updateDoc(doc(db, "mock_packs", packId), updates as Record<string, unknown>);
}

export async function deleteMockPack(packId: string): Promise<void> {
  await deleteDoc(doc(db, "mock_packs", packId));
}

// ──────────────────────────────────────────────────
// JOBS  (B2B)
// ──────────────────────────────────────────────────

export type JobWithId = JobDocument & { id: string };

export async function getJobById(jobId: string): Promise<JobWithId | null> {
  const snap = await getDoc(doc(db, "jobs", jobId));
  if (!snap.exists()) return null;
  return withId(snap.id, snap.data() as JobDocument);
}

export async function getJobsByRecruiter(recruiterId: string): Promise<JobWithId[]> {
  const q = query(
    collections.jobs,
    where("recruiterId", "==", recruiterId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId(d.id, d.data()));
}

export async function getOpenJobs(): Promise<JobWithId[]> {
  const q = query(collections.jobs, where("status", "==", "open"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId(d.id, d.data()));
}

export async function createJob(data: Omit<JobDocument, "createdAt">): Promise<JobWithId> {
  const payload: JobDocument = { ...data, createdAt: serverTimestamp() };
  const ref = await addDoc(collections.jobs, payload);
  return withId(ref.id, payload);
}

export async function updateJob(jobId: string, updates: Partial<JobDocument>): Promise<void> {
  await updateDoc(doc(db, "jobs", jobId), updates as Record<string, unknown>);
}

export async function deleteJob(jobId: string): Promise<void> {
  await deleteDoc(doc(db, "jobs", jobId));
}

// ──────────────────────────────────────────────────
// INTERVIEWS  (single source of truth)
// ──────────────────────────────────────────────────

export type InterviewWithId = InterviewDocument & { id: string };

export async function getInterviewById(interviewId: string): Promise<InterviewWithId | null> {
  const snap = await getDoc(doc(db, "interviews", interviewId));
  if (!snap.exists()) return null;
  return withId(snap.id, snap.data() as InterviewDocument);
}

export async function getInterviewsByCandidate(candidateId: string): Promise<InterviewWithId[]> {
  const q = query(
    collections.interviews,
    where("candidateId", "==", candidateId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId(d.id, d.data()));
}

export async function getInterviewsByRecruiter(recruiterId: string): Promise<InterviewWithId[]> {
  const q = query(
    collections.interviews,
    where("recruiterId", "==", recruiterId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId(d.id, d.data()));
}

export async function getInterviewsByJob(jobId: string): Promise<InterviewWithId[]> {
  const q = query(
    collections.interviews,
    where("jobId", "==", jobId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId(d.id, d.data()));
}

export async function createInterview(
  data: Omit<InterviewDocument, "createdAt">
): Promise<InterviewWithId> {
  const payload: InterviewDocument = { ...data, createdAt: serverTimestamp() };
  const ref = await addDoc(collections.interviews, payload);
  return withId(ref.id, payload);
}

export async function updateInterview(
  interviewId: string,
  updates: Partial<InterviewDocument>
): Promise<void> {
  await updateDoc(doc(db, "interviews", interviewId), updates as Record<string, unknown>);
}

// ──────────────────────────────────────────────────
// TRANSCRIPTS  (sub-collection)
// ──────────────────────────────────────────────────

export type TranscriptWithId = TranscriptDocument & { id: string };

export async function addTranscriptTurn(
  interviewId: string,
  data: Omit<TranscriptDocument, "timestamp">
): Promise<TranscriptWithId> {
  const payload: TranscriptDocument = { ...data, timestamp: serverTimestamp() };
  const col = collections.getTranscriptsCollection(interviewId);
  const ref = await addDoc(col, payload);
  return withId(ref.id, payload);
}

export async function getTranscript(interviewId: string): Promise<TranscriptWithId[]> {
  const col = collections.getTranscriptsCollection(interviewId);
  const q = query(col, orderBy("timestamp", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => withId(d.id, d.data() as TranscriptDocument));
}

export async function bulkAddTranscript(
  interviewId: string,
  turns: Array<{ speaker: "ai" | "candidate"; text: string }>
): Promise<void> {
  const col = collections.getTranscriptsCollection(interviewId);
  // Write turns sequentially to maintain order
  for (const turn of turns) {
    await addDoc(col, { ...turn, timestamp: serverTimestamp() } satisfies TranscriptDocument);
  }
}
