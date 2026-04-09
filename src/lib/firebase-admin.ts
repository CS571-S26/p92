/**
 * Firebase Admin SDK for server-side authentication
 * 
 * Used in API routes to verify Firebase ID tokens.
 * NOTE: This file should only be imported in server-side code.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'heydayproject';

// Singleton Firebase Admin app
let adminApp: App | null = null;
let adminAuth: Auth | null = null;

/**
 * Get the Firebase Admin app (singleton)
 */
function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length === 0) {
      // Initialize with project ID only (uses Application Default Credentials or env vars)
      // For local dev, this works without a service account key
      adminApp = initializeApp({
        projectId: FIREBASE_PROJECT_ID,
      });
    } else {
      adminApp = getApps()[0];
    }
  }
  return adminApp;
}

/**
 * Get the Firebase Admin Auth instance (singleton)
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp());
  }
  return adminAuth;
}

/**
 * Verify a Firebase ID token and return the decoded token
 */
export async function verifyIdToken(token: string) {
  const auth = getAdminAuth();
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return { valid: true, uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('[Firebase Admin] Token verification failed:', error);
    return { valid: false, uid: null, email: null };
  }
}
