import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { libraryService } from '../services/libraryService';
import { UserProfile, UserSubscription } from '../types';
import { computeWriterLimit } from '../lib/writer';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  subscription: UserSubscription | null;
  isSubscribed: boolean;
  /** How many novels this user may own as a writer (admin grant or subscription plan); 0 = not a writer. */
  writerLimit: number;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, name: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  /** Reloads the user AND refreshes the ID token so Firestore rules see the new email_verified claim. */
  reloadUser: () => Promise<boolean>;
  emailVerified: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [writerLimit, setWriterLimit] = useState<number>(0);

  // Writer quota = larger of the admin-granted users/{uid}.writerLimit and the active plan's writerNovelLimit.
  useEffect(() => {
    let cancelled = false;
    async function resolveWriterLimit() {
      if (!profile) {
        setWriterLimit(0);
        return;
      }
      const plan = await libraryService.getSubscriptionPlan(profile); // null for expired / admin_grant
      if (!cancelled) setWriterLimit(computeWriterLimit(profile, plan));
    }
    resolveWriterLimit();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Synchronize profile and admin status once per session when auth state changes (no persistent listener)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setEmailVerified(Boolean(currentUser?.emailVerified));
      if (!currentUser) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Heal a stale token: the SDK may already know the email is verified while the cached
      // ID token still carries email_verified=false (rules would then deny comments/orders/ratings).
      try {
        if (currentUser.emailVerified) {
          const tokenResult = await currentUser.getIdTokenResult();
          if (!tokenResult.claims.email_verified) {
            await currentUser.getIdToken(true);
          }
        }
      } catch {
        // ignore: handled by the explicit refresh right before protected writes
      }

      try {
        // 1. Fetch or create users/{uid} once per session
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'قارئ حبر',
            email: currentUser.email || '',
            createdAt: new Date(),
            subscription: null,
          };
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);
        }

        // 2. Check admins/{uid} once per session
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminSnap = await getDoc(adminDocRef);
        setIsAdmin(adminSnap.exists());
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Auth profile fetch notice (fallback):', err);
        }
        setProfile({
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'قارئ',
          email: currentUser.email || '',
          createdAt: new Date(),
          subscription: null,
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    try {
      libraryService.invalidateEntitlementCache(auth.currentUser.uid);
      await auth.currentUser.reload();
      // email_verified lives inside the ID token: force a refresh so the security rules see it.
      await auth.currentUser.getIdToken(true);
      setUser(auth.currentUser);
      setEmailVerified(auth.currentUser.emailVerified);

      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
      const adminSnap = await getDoc(doc(db, 'admins', auth.currentUser.uid));
      setIsAdmin(adminSnap.exists());
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('Error refreshing profile:', e);
      }
    }
  };

  const reloadUser = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true); // otherwise rules keep seeing email_verified=false for up to 1h
      setUser(auth.currentUser);
      const verified = auth.currentUser.emailVerified;
      setEmailVerified(verified);
      return verified;
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Error reloading auth user:', e);
      return false;
    }
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    await refreshProfile();
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    await refreshProfile();
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      try {
        await sendEmailVerification(cred.user);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('sendEmailVerification notice:', err);
      }
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        name,
        email,
        createdAt: new Date(),
        subscription: null,
      };
      try {
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      } catch {
        // ignore
      }
      setProfile(newProfile);
    }
  };

  const logout = async () => {
    libraryService.invalidateEntitlementCache();
    await firebaseSignOut(auth);
    setProfile(null);
    setIsAdmin(false);
    setEmailVerified(false);
    setWriterLimit(0);
  };

  const subscription = profile?.subscription || null;
  const isSubscribed = Boolean(subscription && subscription.expiresAt > Date.now());

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        subscription,
        isSubscribed,
        writerLimit,
        loading,
        emailVerified,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendVerificationEmail,
        reloadUser,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
