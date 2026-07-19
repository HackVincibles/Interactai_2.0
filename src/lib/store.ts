/**
 * store.ts — MIGRATED TO FIRESTORE
 *
 * All mocked in-memory arrays have been removed.
 * This file now re-exports the Firestore service layer so that
 * existing API routes can continue to import from "@/lib/store"
 * without requiring a mass rename in a single commit.
 *
 * Gradually move each API route to import directly from
 * "@/lib/firestore-service" as you touch them.
 */

export * from "./firestore-service";
