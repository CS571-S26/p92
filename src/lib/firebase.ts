import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

// Firebase config - hardcoded (safe to expose publicly)
const firebaseConfig = {
  apiKey: "AIzaSyDVLeC8Z5Rta9xvOSwOUUwBsdBebV9wdvc",
  authDomain: "heydayproject.firebaseapp.com",
  projectId: "heydayproject",
  storageBucket: "heydayproject.firebasestorage.app",
  messagingSenderId: "387224207641",
  appId: "1:387224207641:web:ef397100748e1207984588",
  measurementId: "G-742TNXL2WT"
};

// Initialize app only when needed (lazy initialization)
let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;

function ensureInitialized() {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
  }
  return { app: app!, auth: authInstance! };
}

// Export auth that initializes on first access
export const auth: Auth = new Proxy({} as Auth, {
  get(_, prop: string | symbol) {
    const { auth } = ensureInitialized();
    const value = (auth as any)[prop];
    if (typeof value === 'function') {
      return value.bind(auth);
    }
    return value;
  }
});

export const googleProvider = new GoogleAuthProvider();

// Analytics is browser-only, so lazy-load it
export function getAnalyticsSafe() {
  if (typeof window !== "undefined") {
    const { getAnalytics } = require("firebase/analytics");
    const { app } = ensureInitialized();
    return getAnalytics(app);
  }
  return undefined;
}
