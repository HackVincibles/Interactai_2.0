/**
 * firebase.ts — backward-compat re-export
 * All new code should import from "@/lib/firebase-client" directly.
 * This file exists so older imports from "@/lib/firebase" keep working.
 */
export * from "./firebase-client";
