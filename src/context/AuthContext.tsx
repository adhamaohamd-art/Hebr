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

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  subscription: UserSubscription | null;
  isSubscribed: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, name: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize profile and admin status once per session when auth state changes (no persistent listener)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
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
      setUser(auth.currentUser);

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

  const reloadUser = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        setUser(auth.currentUser);
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Error reloading auth user:', e);
      }
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
        loading,
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
