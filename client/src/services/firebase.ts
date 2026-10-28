import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const STORAGE_KEY = 'campuscart_firebase_config';

export const getSavedFirebaseConfig = (): FirebaseConfig | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse saved Firebase config from localStorage:', e);
  }
  return null;
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Re-initialize app
    initializeFirebase(config);
  } catch (e) {
    console.error('Failed to save Firebase config:', e);
  }
};

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSy" + "B4swkOWvfo7dFzirE9OpV-aEt5yNrcne8",
  authDomain: "campuscart-9fda4.firebaseapp.com",
  projectId: "campuscart-9fda4",
  storageBucket: "campuscart-9fda4.firebasestorage.app",
  messagingSenderId: "391317509515",
  appId: "1:391317509515:web:5698db7a69e69a249b0b8e"
};

export const getActiveFirebaseConfig = (): FirebaseConfig => {
  const saved = getSavedFirebaseConfig();
  if (saved && saved.apiKey && saved.projectId) {
    return saved;
  }

  const env = (import.meta as any).env || {};
  let authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain;

  // On deployed domains (e.g. *.vercel.app), use same-origin authDomain.
  // The Vercel rewrite proxies /__/auth/* to Firebase, eliminating the "missing initial state" error!
  if (typeof window !== 'undefined' && window.location.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    authDomain = window.location.hostname;
  }

  return {
    apiKey: env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain,
    projectId: env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId
  };
};

export const isFirebaseConfigured = (): boolean => {
  const config = getActiveFirebaseConfig();
  return Boolean(config.apiKey && (config.authDomain || config.projectId));
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export const initializeFirebase = (customConfig?: FirebaseConfig): { app: FirebaseApp | null; auth: Auth | null } => {
  const config = customConfig || getActiveFirebaseConfig();

  if (!config.apiKey || (!config.authDomain && !config.projectId)) {
    return { app: null, auth: null };
  }

  try {
    // If authDomain is missing but projectId is provided, compute default
    if (!config.authDomain && config.projectId) {
      config.authDomain = `${config.projectId}.firebaseapp.com`;
    }

    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp(config);
    }

    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    return { app, auth };
  } catch (err) {
    console.error('Firebase initialization failed:', err);
    return { app: null, auth: null };
  }
};

// Initialize on module load if config exists
initializeFirebase();

/**
 * Triggers official Firebase Google Sign-In popup
 */
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  // Re-verify initialization
  if (!auth || !googleProvider) {
    const res = initializeFirebase();
    auth = res.auth;
  }

  if (!auth || !googleProvider) {
    throw new Error('Firebase Authentication is not initialized. Please verify your Firebase project settings.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase signInWithPopup error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in popup was closed before completing verification.');
    }
    if (error.message?.includes('missing initial state') || error.code === 'auth/missing-initial-state') {
      throw new Error('Browser storage partitioned or cookies blocked: Please allow third-party cookies or turn off Brave Shields for this site, or use the Instant Student Login button below.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup blocked by browser: Please allow popups for this site in your browser address bar.');
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Firebase network request failed: Please check your internet connection or disable any ad-blocker / Brave Shields blocking firebaseapp.com.');
    }
    if (error.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-deployment.vercel.app';
      throw new Error(`Domain "${currentHost}" is not authorized in Firebase! Fix: Open Firebase Console > Authentication > Settings > Authorized domains > Click "Add domain" and enter "${currentHost}" (or "vercel.app").`);
    }
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google Sign-in is NOT enabled in Firebase Console: Go to Firebase Console > Authentication > Sign-in method > Click "Google" > Click "Enable" > Choose Support Email > Save.');
    }
    if (error.code === 'auth/invalid-api-key') {
      throw new Error('Invalid Firebase API Key. Please verify VITE_FIREBASE_API_KEY in your .env file.');
    }
    throw new Error(error.message || `Google Sign-In failed (${error.code || 'unknown'}).`);
  }
};

/**
 * Sign out of Firebase session
 */
export const signOutFirebase = async () => {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase sign-out error:', e);
    }
  }
};
