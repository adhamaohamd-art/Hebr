import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeMultiLine, sanitizeSingleLine } from '../lib/sanitize';
import { LIMITS } from '../config';
import { Comment } from '../types';

export interface ChapterCommentsPage {
  comments: Comment[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

interface CachedComments {
  page: ChapterCommentsPage;
  cachedAt: number;
}

let lastCommentTimestamp = 0;
const commentsCache = new Map<string, CachedComments>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export const commentService = {
  /**
   * Invalidate 2-minute in-memory cache for a chapter or all chapters
   */
  invalidateCache(chapterId?: string): void {
    if (!chapterId) {
      commentsCache.clear();
      return;
    }
    commentsCache.delete(`${chapterId}_true`);
    commentsCache.delete(`${chapterId}_false`);
  },

  /**
   * Fetches chapter comments with limit(20) and startAfter cursor.
   * Initial page is cached for 2 minutes and invalidated when user posts.
   */
  async getChapterComments(
    chapterId: string,
    includeHidden = false,
    lastDoc?: QueryDocumentSnapshot | null
  ): Promise<ChapterCommentsPage> {
    const cacheKey = `${chapterId}_${includeHidden}`;

    // Return cached first page if valid and no pagination cursor
    if (!lastDoc) {
      const cached = commentsCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        return cached.page;
      }
    }

    try {
      const colRef = collection(db, 'comments');
      const constraints = [
        where('chapterId', '==', chapterId),
        ...(includeHidden ? [] : [where('hidden', '==', false)]),
        orderBy('createdAt', 'desc'),
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(20),
      ];

      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);
      const list: Comment[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...(d.data() as Omit<Comment, 'id'>) });
      });

      const nextLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      const pageResult: ChapterCommentsPage = {
        comments: list,
        lastDoc: nextLastDoc,
        hasMore: snap.docs.length === 20,
      };

      if (!lastDoc) {
        commentsCache.set(cacheKey, {
          page: pageResult,
          cachedAt: Date.now(),
        });
      }

      return pageResult;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Firestore comments fetch notice:', err);
      }
      return { comments: [], lastDoc: null, hasMore: false };
    }
  },

  /**
   * Adds a sanitized comment with 20s anti-spam throttling.
   * Invalidates in-memory comments cache for the chapter.
   */
  async addComment(
    novelId: string,
    chapterId: string,
    userId: string,
    userName: string,
    rawText: string
  ): Promise<string> {
    const now = Date.now();
    const cooldownMs = LIMITS.commentCooldownSeconds * 1000;
    if (now - lastCommentTimestamp < cooldownMs) {
      const waitRemaining = Math.ceil((cooldownMs - (now - lastCommentTimestamp)) / 1000);
      throw new Error(`يرجى الانتظار ${waitRemaining} ثانية قبل إرسال تعليق آخر.`);
    }

    const cleanText = sanitizeMultiLine(rawText).slice(0, LIMITS.commentMax);
    if (!cleanText || cleanText.length < 1) {
      throw new Error('التعليق لا يمكن أن يكون فارغاً.');
    }

    const cleanUserName = sanitizeSingleLine(userName || 'قارئ حبر').slice(0, LIMITS.displayNameMax);
    const id = doc(collection(db, 'comments')).id;

    await setDoc(doc(db, 'comments', id), {
      novelId,
      chapterId,
      userId,
      userName: cleanUserName,
      text: cleanText,
      hidden: false,
      createdAt: serverTimestamp(),
    });
    lastCommentTimestamp = now;

    // Invalidate in-memory cache for this chapter
    this.invalidateCache(chapterId);

    return id;
  },

  async hideComment(commentId: string, hidden: boolean, chapterId?: string): Promise<void> {
    await setDoc(doc(db, 'comments', commentId), { hidden }, { merge: true });
    if (chapterId) this.invalidateCache(chapterId);
  },

  async deleteComment(commentId: string, chapterId?: string): Promise<void> {
    await deleteDoc(doc(db, 'comments', commentId));
    if (chapterId) this.invalidateCache(chapterId);
  },
};
