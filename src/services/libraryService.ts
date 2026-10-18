import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Entitlement, UserLibraryItem, Novel, ChapterMeta, UserProfile, Plan } from '../types';
import { settingsService } from './settingsService';
import { isChapterFree } from '../lib/freeChapters';

interface CachedEntitlement {
  entitlement: Entitlement | null;
  expiresAt: number;
}

interface PendingProgress {
  userId: string;
  novelId: string;
  data: { lastChapter?: number; bookmarked?: boolean };
  lastWrittenChapter?: number;
  lastWrittenAt: number;
  timer?: ReturnType<typeof setTimeout>;
}

const entitlementCache = new Map<string, CachedEntitlement>();
const ENTITLEMENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const progressQueue = new Map<string, PendingProgress>();

export function flushPendingProgress(): void {
  for (const item of progressQueue.values()) {
    if (item.timer) {
      clearTimeout(item.timer);
      item.timer = undefined;
    }
    if (item.data && Object.keys(item.data).length > 0) {
      const payload = { ...item.data };
      item.data = {};
      item.lastWrittenAt = Date.now();
      if (payload.lastChapter !== undefined) {
        item.lastWrittenChapter = payload.lastChapter;
      }
      try {
        const ref = doc(db, 'users', item.userId, 'library', item.novelId);
        setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      } catch {
        // ignore unload/pagehide error
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPendingProgress);
  window.addEventListener('beforeunload', flushPendingProgress);
}

export const libraryService = {
  /**
   * Invalidate 5-minute in-memory entitlement cache for a user or globally
   */
  invalidateEntitlementCache(userId?: string): void {
    if (!userId) {
      entitlementCache.clear();
      return;
    }
    const prefix = `${userId}_`;
    for (const key of entitlementCache.keys()) {
      if (key.startsWith(prefix)) {
        entitlementCache.delete(key);
      }
    }
  },

  /**
   * Caches getUserEntitlement in-memory per uid+novelId for 5 minutes (caches null results too).
   */
  async getUserEntitlement(userId: string, novelId: string): Promise<Entitlement | null> {
    const key = `${userId}_${novelId}`;
    const cached = entitlementCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.entitlement;
    }

    try {
      const snap = await getDoc(doc(db, 'users', userId, 'entitlements', novelId));
      const ent = snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Entitlement, 'id'>) } : null;
      entitlementCache.set(key, {
        entitlement: ent,
        expiresAt: Date.now() + ENTITLEMENT_CACHE_TTL_MS,
      });
      return ent;
    } catch (err) {
      // Never cache a failure: a paying reader must not be locked out by one transient error.
      // The caller shows a friendly retry state.
      if (import.meta.env.DEV) console.warn('Firestore getUserEntitlement notice:', err);
      throw err;
    }
  },

  async getUserEntitlements(userId: string): Promise<Record<string, Entitlement>> {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'entitlements'));
      const result: Record<string, Entitlement> = {};
      snap.forEach(d => {
        result[d.id] = { id: d.id, ...(d.data() as Omit<Entitlement, 'id'>) };
      });
      return result;
    } catch (err) {
      console.warn('Firestore getUserEntitlements notice:', err);
      return {};
    }
  },

  async getUserLibrary(userId: string): Promise<UserLibraryItem[]> {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'library'));
      const items: UserLibraryItem[] = [];
      snap.forEach(d => {
        items.push({ novelId: d.id, ...(d.data() as Omit<UserLibraryItem, 'novelId'>) });
      });
      return items;
    } catch (err) {
      console.warn('Firestore getUserLibrary notice:', err);
      return [];
    }
  },

  /**
   * Writes only if lastChapter changed and at most once per 60 seconds per novel (trailing write, flush on pagehide).
   */
  async updateLibraryProgress(
    userId: string,
    novelId: string,
    data: { lastChapter?: number; bookmarked?: boolean }
  ): Promise<void> {
    const key = `${userId}_${novelId}`;
    let item = progressQueue.get(key);
    if (!item) {
      item = {
        userId,
        novelId,
        data: {},
        lastWrittenAt: 0,
      };
      progressQueue.set(key, item);
    }

    // Write ONLY if lastChapter changed (or bookmarked changed)
    if (data.lastChapter !== undefined) {
      if (item.lastWrittenChapter === data.lastChapter && data.bookmarked === undefined) {
        return;
      }
    }

    item.data = { ...item.data, ...data };

    const now = Date.now();
    const elapsed = now - item.lastWrittenAt;
    const delay = Math.max(0, 60000 - elapsed);

    if (item.timer) {
      clearTimeout(item.timer);
    }

    const flushItem = async () => {
      if (!item) return;
      item.timer = undefined;
      if (!item.data || Object.keys(item.data).length === 0) return;
      const payload = { ...item.data };
      item.data = {};
      item.lastWrittenAt = Date.now();
      if (payload.lastChapter !== undefined) {
        item.lastWrittenChapter = payload.lastChapter;
      }
      try {
        const ref = doc(db, 'users', item.userId, 'library', item.novelId);
        await setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Firestore updateLibraryProgress notice:', err);
        }
      }
    };

    item.timer = setTimeout(flushItem, delay);
  },

  flushPendingProgress,

  /** Loads the plan behind the user's active subscription (cached by settingsService). */
  async getSubscriptionPlan(profile: UserProfile | null): Promise<Plan | null> {
    const sub = profile?.subscription;
    if (!sub || sub.expiresAt <= Date.now() || sub.planId === 'admin_grant') return null;
    try {
      const plans = await settingsService.getPlans();
      return plans.find(p => p.id === sub.planId) || null;
    } catch {
      return null;
    }
  },

  /** Mirrors firestore.rules: does this subscription unlock this novel? */
  subscriptionCoversNovel(profile: UserProfile | null, plan: Plan | null, novelId: string): boolean {
    const sub = profile?.subscription;
    if (!sub || sub.expiresAt <= Date.now()) return false;
    if (sub.planId === 'admin_grant') return true;
    if (!plan || plan.id !== sub.planId) return false;
    return plan.accessAll === true || (plan.novelIds || []).includes(novelId);
  },

  checkChapterUnlocked(
    novel: Novel,
    chapter: ChapterMeta,
    profile: UserProfile | null,
    entitlement: Entitlement | null,
    isAdmin = false,
    plan: Plan | null = null
  ): { isUnlocked: boolean; reason: 'free' | 'novel_entitlement' | 'book_entitlement' | 'subscription' | 'admin' | 'locked' } {
    if (isAdmin) {
      return { isUnlocked: true, reason: 'admin' };
    }

    // 1. Whole novel is free, OR chapter is explicitly free, OR chapter number <= novel.freeChapters
    if (isChapterFree(chapter.number, novel, chapter.isFree)) {
      return { isUnlocked: true, reason: 'free' };
    }

    // 2. User has entitlement for this novel ('novel' or 'book')
    if (entitlement) {
      return {
        isUnlocked: true,
        reason: entitlement.type === 'book' ? 'book_entitlement' : 'novel_entitlement',
      };
    }

    // 3. Active subscription whose plan includes THIS novel
    if (this.subscriptionCoversNovel(profile, plan, novel.id)) {
      return { isUnlocked: true, reason: 'subscription' };
    }

    return { isUnlocked: false, reason: 'locked' };
  },
};
