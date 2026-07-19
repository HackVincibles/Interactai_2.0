/**
 * firebase-admin.ts
 * Server-side Firebase Admin SDK initialization.
 * Only imported in API routes / server components — never in client code.
 *
 * Credentials are resolved via Application Default Credentials (ADC).
 * For local dev, set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path,
 * OR export FIREBASE_SERVICE_ACCOUNT_JSON with the JSON content inline.
 */

import { initializeApp, getApps, App, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Support inline service account JSON (useful on Vercel / Railway)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (e) {
      console.error("[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    }
  }

  // Fall back to Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS env)
  return initializeApp({
    credential: applicationDefault(),
  });
}

adminApp = getAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);
export { adminApp };
