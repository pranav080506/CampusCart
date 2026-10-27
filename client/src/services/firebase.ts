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
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

export const getActiveFirebaseConfig = (): FirebaseConfig => {
  const saved = getSavedFirebaseConfig();
  if (saved && saved.apiKey && saved.projectId) {
    return saved;
  }

  const env = (import.meta as any).env || {};
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
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
      prompt: 'select_account',
      // Hint to prioritize college google account domain
      hd: 'gibitm.ac.in'
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
    throw new Error('Firebase Authentication is not configured yet. Please configure your Firebase Web App credentials.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in popup was closed before completing verification.');
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Domain unauthorized in Firebase: Please add "localhost" to your Firebase Console > Authentication > Settings > Authorized domains.');
    }
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google Sign-in is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
    }
    throw new Error(error.message || 'Firebase Google Sign-In failed.');
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
