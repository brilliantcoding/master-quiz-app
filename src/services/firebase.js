// Firebase service - handles saving/loading quiz results
// If Firebase is not configured, falls back to localStorage gracefully

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_firebase_api_key';

let db = null;
let auth = null;

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.warn('Firebase init failed:', e);
  }
}

export async function ensureAuth() {
  if (!auth) return null;
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (e) {
    console.warn('Firebase auth failed:', e);
    return null;
  }
}

export async function saveQuizResult(result) {
  const entry = { ...result, savedAt: new Date().toISOString() };

  // Save summary (no questionDetails) to localStorage to avoid quota issues
  const { questionDetails, ...summary } = entry;
  try {
    const stored = JSON.parse(localStorage.getItem('quizResults') || '[]');
    stored.unshift(summary);
    localStorage.setItem('quizResults', JSON.stringify(stored.slice(0, 50)));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }

  // Save full data (including questionDetails) to Firestore if configured
  if (db) {
    try {
      await ensureAuth();
      await addDoc(collection(db, 'quizResults'), {
        ...entry,
        createdAt: serverTimestamp(),
      });
      return { success: true, source: 'firebase' };
    } catch (e) {
      console.warn('Firestore save failed, using localStorage:', e);
    }
  }
  return { success: true, source: 'localStorage' };
}

export async function getRecentResults(limitCount = 10) {
  if (db) {
    try {
      const q = query(collection(db, 'quizResults'), orderBy('createdAt', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Firestore read failed:', e);
    }
  }
  // Fallback to localStorage
  const stored = JSON.parse(localStorage.getItem('quizResults') || '[]');
  return stored.slice(0, limitCount);
}

export { isConfigured };
