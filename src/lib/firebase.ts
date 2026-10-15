import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {}) || {};

// Public Firebase web config (not secret: access is protected by Firestore rules).
// Environment variables override these defaults; the defaults make sure a missing
// variable in the hosting build can never blank the whole site.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyB2iiBdR5FKKScK6RVoa_btN64Jxq0aCSc',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'habr-328b3.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'habr-328b3',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'habr-328b3.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '967417970771',
  appId: env.VITE_FIREBASE_APP_ID || '1:967417970771:web:8b07c12590d21805bfc6a6',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-E9ZJ0CRGZM',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional App Check initialization (only if site key is configured)
if (typeof window !== 'undefined' && env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('App Check initialization notice:', err);
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Returns a user-friendly error message, translating quota and permission errors
 * into a calm and friendly message, hiding raw internal Firestore errors.
 */
export function getFriendlyErrorMessage(error: unknown, language: 'ar' | 'en' = 'ar'): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes('permission-denied') || lower.includes('missing or insufficient permissions')) {
    return language === 'ar'
      ? 'لا تملك صلاحية تنفيذ هذا الإجراء. تأكد من تسجيل الدخول وتأكيد بريدك الإلكتروني.'
      : 'You do not have permission to do this. Make sure you are signed in and your email is verified.';
  }

  const isBusyOrQuota =
    lower.includes('resource-exhausted') ||
    lower.includes('quota') ||
    lower.includes('unavailable') ||
    lower.includes('deadline-exceeded') ||
    lower.includes('busy');

  if (isBusyOrQuota) {
    return language === 'ar'
      ? 'الموقع مشغول حالياً، حاول بعد قليل'
      : 'The site is currently busy, please try again shortly.';
  }

  return language === 'ar'
    ? 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.'
    : 'An unexpected error occurred. Please try again.';
}

/**
 * Error text for ADMIN screens. Unlike getFriendlyErrorMessage (visitors) it tells the admin
 * the real reason, so a failed save is never silent and never mistaken for success.
 */
export function getAdminErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code || '';
  const raw = error instanceof Error ? error.message : String(error);
  if (code.includes('permission-denied')) {
    return 'تم رفض الحفظ: حسابك غير مضاف كأدمن في مجموعة admins، أو قواعد Firestore غير منشورة.';
  }
  if (code.includes('resource-exhausted') || raw.toLowerCase().includes('quota')) {
    return 'تم تجاوز حد الاستخدام اليومي المجاني لـ Firestore، حاول لاحقاً.';
  }
  if (raw.includes('undefined')) {
    return `بيانات غير صالحة (حقل فارغ غير مدعوم): ${raw}`;
  }
  return raw || 'حدث خطأ غير متوقع أثناء الحفظ.';
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  if (import.meta.env.DEV) {
    console.error(`[Firestore DEV] Operation: ${operationType}, Path: ${path}`, error);
  }
  const friendly = getFriendlyErrorMessage(error);
  throw new Error(friendly);
}

/**
 * Forces a fresh ID token so claims such as email_verified are current before a protected write.
 * (Security rules read the claim from the token, which can stay stale for up to an hour after the
 * email was verified.)
 */
export async function refreshAuthToken(): Promise<void> {
  try {
    await auth.currentUser?.getIdToken(true);
  } catch {
    // Network hiccup: the write that follows will report the real problem.
  }
}
