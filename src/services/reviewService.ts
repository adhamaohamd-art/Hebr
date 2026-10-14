import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  updateDoc,
  increment,
  runTransaction,
  writeBatch,
  deleteField,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db, auth, getFriendlyErrorMessage } from '../lib/firebase';
import { clientCache } from '../lib/cache';
import { Review, ModerationReport, RatingDistribution, Novel } from '../types';
import { settingsService } from './settingsService';
import { novelService } from './novelService';
import { applyRatingChange } from '../lib/rating';

/** Business-rule failure with a message that is safe to show to the reader. */
class ReviewFlowError extends Error {}

/** Normalizes a stored rating to an integer 1..5, or null when it is not a valid star value. */
function asStar(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

export interface PaginatedReviews {
  reviews: Review[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  totalCount?: number;
}

export const reviewService = {
  /**
   * Generates deterministic document ID for a user's review on a novel:
   * guarantees exactly 1 review per user per novel at the database level.
   */
  getReviewDocId(novelId: string, userId: string): string {
    return `${novelId}_${userId}`;
  },

  /**
   * Fetches user's own review for a novel (O(1) read).
   */
  async getUserReviewForNovel(novelId: string, userId: string): Promise<Review | null> {
    try {
      const docId = this.getReviewDocId(novelId, userId);
      const snap = await getDoc(doc(db, 'reviews', docId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as Omit<Review, 'id'>) };
    } catch (err) {
      if (import.meta.env.DEV) console.warn('getUserReviewForNovel notice:', err);
      return null;
    }
  },

  /**
   * ADMIN ONLY (full resync). Recalculates genuine visitor rating aggregates from ALL published
   * reviews of a novel (one read per review), then pushes the result to catalog/home.
   * Ordinary rating submissions never call this: they update the aggregates incrementally
   * inside a transaction (see submitOrUpdateReview).
   */
  async recalculateNovelAggregates(novelId: string): Promise<{
    average: number;
    count: number;
    distribution: RatingDistribution;
  }> {
    const q = query(
      collection(db, 'reviews'),
      where('novelId', '==', novelId),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);

    const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    let count = 0;

    snap.forEach(docSnap => {
      const data = docSnap.data() as Review;
      const r = Math.min(5, Math.max(1, Math.round(data.rating || 0)));
      if (r >= 1 && r <= 5) {
        distribution[r as 1 | 2 | 3 | 4 | 5] = (distribution[r as 1 | 2 | 3 | 4 | 5] || 0) + 1;
        sum += r;
        count += 1;
      }
    });

    const average = count > 0 ? Number((sum / count).toFixed(2)) : 0;

    // Update novel document with genuine aggregates
    try {
      await updateDoc(doc(db, 'novels', novelId), {
        visitorRatingAverage: average,
        visitorRatingCount: count,
        ratingDistribution: distribution,
        rating: count > 0 ? average.toFixed(1) : '',
        updatedAt: serverTimestamp(),
      });
      clientCache.invalidate('catalog_home');
      clientCache.invalidate(`novel_${novelId}`);
      await novelService.syncNovelToCatalog(novelId);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Could not update novel aggregates document:', err);
    }

    return { average, count, distribution };
  },

  /**
   * Submits or updates a visitor's genuine rating and review.
   *
   * The review and the novel's rating aggregates are written in ONE transaction, and the
   * aggregates are adjusted incrementally (+/- this single rating) instead of re-reading every
   * review. Cost per submission is a handful of reads regardless of how many reviews exist, and
   * concurrent submissions cannot overwrite each other. firestore.rules enforce the same
   * arithmetic, so the aggregates cannot be forged from the browser.
   * The reader's email is deliberately NOT stored on the (publicly readable) review document.
   */
  async submitOrUpdateReview(params: {
    novelId: string;
    novelTitle: string;
    userId: string;
    userName: string;
    rating: number;
    reviewText?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { novelId, novelTitle, userId, userName, rating, reviewText } = params;

    // Validation
    const cleanRating = Math.min(5, Math.max(1, Math.round(rating)));
    if (!cleanRating || isNaN(cleanRating)) {
      return { success: false, error: 'التقييم يجب أن يكون بين 1 و 5 نجوم.' };
    }

    // firestore.rules require a verified email for ratings
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      return { success: false, error: 'يرجى تأكيد بريدك الإلكتروني أولاً لتتمكن من تقييم الروايات.' };
    }

    // Check site-wide settings
    const settings = await settingsService.getSettings();
    if (settings.globalRatingsEnabled === false) {
      return { success: false, error: 'التقييمات والمراجعات مغلقة حالياً على المنصة.' };
    }

    // Check user profile status
    try {
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData.status === 'restricted') {
          return {
            success: false,
            error: uData.restrictedReason
              ? `حسابك مقيد عن المشاركة: ${uData.restrictedReason}`
              : 'حسابك مقيد حالياً من نشر المراجعات والتقييمات.',
          };
        }
        if (uData.status === 'deactivated') {
          return { success: false, error: 'هذا الحساب معطل حالياً.' };
        }
      }
    } catch {
      // Proceed if read fails non-critically
    }

    const docId = this.getReviewDocId(novelId, userId);

    // Soft daily limit (client-side only; real abuse protection is the one-review-per-novel
    // document id, the verified-email rule and optional App Check).
    // Reads at most maxDaily + 1 of the user's most recent reviews.
    const maxDaily = settings.maxReviewsPerDayPerUser || 5;
    try {
      const recentSnap = await getDocs(
        query(
          collection(db, 'reviews'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(maxDaily + 1)
        )
      );
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      let countToday = 0;
      recentSnap.forEach(snap => {
        const d = snap.data();
        const createdMs = d.createdAt?.toMillis ? d.createdAt.toMillis() : (d.createdAt ? new Date(d.createdAt).getTime() : 0);
        if (createdMs > oneDayAgo && snap.id !== docId) {
          countToday++;
        }
      });
      if (countToday >= maxDaily) {
        return {
          success: false,
          error: `لقد وصلت إلى الحد اليومي لكتابة المراجعات (${maxDaily} مراجعات يومياً) لمنع التكرار والإزعاج.`,
        };
      }
    } catch {
      // proceed gracefully
    }

    const reviewRef = doc(db, 'reviews', docId);
    const novelRef = doc(db, 'novels', novelId);
    const cleanText = (reviewText || '').trim().slice(0, 1000);
    const cleanName = (userName || 'قارئ').slice(0, 60);
    const cleanTitle = (novelTitle || '').slice(0, 100);

    try {
      await runTransaction(db, async tx => {
        const novelSnap = await tx.get(novelRef);
        const reviewSnap = await tx.get(reviewRef);

        if (!novelSnap.exists()) {
          throw new ReviewFlowError('هذه الرواية غير متاحة للتقييم.');
        }
        const novelData = novelSnap.data() as Novel;
        if (novelData.ratingsEnabled === false) {
          throw new ReviewFlowError('التقييمات والمراجعات مغلقة حالياً لهذه الرواية.');
        }

        let oldRating: number | null = null;
        if (reviewSnap.exists()) {
          const existing = reviewSnap.data() as Review;
          if (existing.status !== 'published') {
            throw new ReviewFlowError('تم إخفاء مراجعتك السابقة من الإدارة، ولا يمكن تعديلها.');
          }
          oldRating = asStar(existing.rating);
        }

        if (!reviewSnap.exists()) {
          tx.set(reviewRef, {
            id: docId,
            novelId,
            novelTitle: cleanTitle,
            userId,
            userName: cleanName,
            rating: cleanRating,
            reviewText: cleanText,
            status: 'published',
            reportCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          tx.update(reviewRef, {
            novelTitle: cleanTitle,
            userName: cleanName,
            rating: cleanRating,
            reviewText: cleanText,
            updatedAt: serverTimestamp(),
            // Remove the email that older versions stored on this public document
            userEmail: deleteField(),
          });
        }

        // Only touch the novel when the star value actually changed
        if (oldRating !== cleanRating) {
          const agg = applyRatingChange(novelData, oldRating, cleanRating);
          tx.update(novelRef, { ...agg, updatedAt: serverTimestamp() });
        }
      });
    } catch (err) {
      if (err instanceof ReviewFlowError) {
        return { success: false, error: err.message };
      }
      if (err instanceof Error && err.message.includes('مزامنة')) {
        return { success: false, error: err.message };
      }
      if (import.meta.env.DEV) console.warn('submitOrUpdateReview error:', err);
      return { success: false, error: getFriendlyErrorMessage(err) };
    }

    clientCache.invalidate(`novel_${novelId}`);
    return { success: true };
  },

  /**
   * Deletes a visitor's own review and removes its star from the novel aggregates
   * (same transaction, same incremental arithmetic as submitOrUpdateReview).
   */
  async deleteUserReview(novelId: string, userId: string): Promise<boolean> {
    try {
      const reviewRef = doc(db, 'reviews', this.getReviewDocId(novelId, userId));
      const novelRef = doc(db, 'novels', novelId);

      await runTransaction(db, async tx => {
        const novelSnap = await tx.get(novelRef);
        const reviewSnap = await tx.get(reviewRef);
        if (!reviewSnap.exists()) return;

        const existing = reviewSnap.data() as Review;
        const oldRating = existing.status === 'published' ? asStar(existing.rating) : null;

        tx.delete(reviewRef);
        if (oldRating !== null && novelSnap.exists()) {
          const agg = applyRatingChange(novelSnap.data() as Novel, oldRating, null);
          tx.update(novelRef, { ...agg, updatedAt: serverTimestamp() });
        }
      });

      clientCache.invalidate(`novel_${novelId}`);
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error deleting user review:', err);
      return false;
    }
  },

  /**
   * Fetches paginated published reviews for a novel.
   */
  async getNovelReviews(options: {
    novelId: string;
    ratingFilter?: number;
    pageSize?: number;
    lastDoc?: DocumentSnapshot | null;
  }): Promise<PaginatedReviews> {
    const { novelId, ratingFilter, pageSize = 8, lastDoc } = options;

    try {
      let q = query(
        collection(db, 'reviews'),
        where('novelId', '==', novelId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(pageSize + 1)
      );

      if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
        q = query(
          collection(db, 'reviews'),
          where('novelId', '==', novelId),
          where('status', '==', 'published'),
          where('rating', '==', ratingFilter),
          orderBy('createdAt', 'desc'),
          limit(pageSize + 1)
        );
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snap = await getDocs(q);
      const docs = snap.docs;
      const hasMore = docs.length > pageSize;
      const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

      const reviews: Review[] = resultDocs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Review, 'id'>),
      }));

      return {
        reviews,
        lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
        hasMore,
      };
    } catch (err) {
      if (import.meta.env.DEV) console.warn('getNovelReviews notice:', err);
      return { reviews: [], lastDoc: null, hasMore: false };
    }
  },

  /**
   * Submits a visitor report against a review that violates clear platform policies.
   */
  async reportReview(params: {
    reviewId: string;
    novelId: string;
    novelTitle?: string;
    reportedUserId: string;
    reportedUserName?: string;
    reporterUid: string;
    reporterName: string;
    reason: 'spam' | 'harassment' | 'unlawful' | 'other';
    details?: string;
    reviewExcerpt?: string;
    reviewRating?: number;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload: ModerationReport = {
        id: reportId,
        reviewId: params.reviewId,
        novelId: params.novelId,
        novelTitle: params.novelTitle,
        reportedUserId: params.reportedUserId,
        reportedUserName: params.reportedUserName,
        reporterUid: params.reporterUid,
        reporterName: params.reporterName,
        reason: params.reason,
        details: (params.details || '').slice(0, 500),
        reviewExcerpt: (params.reviewExcerpt || '').slice(0, 200),
        reviewRating: params.reviewRating,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'reports', reportId), payload);

      // Increment report count on review document
      try {
        await updateDoc(doc(db, 'reviews', params.reviewId), {
          reportCount: increment(1),
        });
      } catch {
        // non-critical
      }

      return { success: true, message: 'تم إرسال البلاغ بنجاح للإدارة لمراجعته.' };
    } catch (err) {
      if (import.meta.env.DEV) console.error('reportReview error:', err);
      return { success: false, message: 'حدث خطأ أثناء إرسال البلاغ.' };
    }
  },

  /**
   * Fetches reviews for the Admin Moderation Dashboard with optional filtering.
   */
  async getAdminReviews(options?: {
    novelId?: string;
    rating?: number;
    status?: string;
    limitCount?: number;
  }): Promise<Review[]> {
    try {
      let q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(options?.limitCount || 100));

      if (options?.novelId) {
        q = query(collection(db, 'reviews'), where('novelId', '==', options.novelId), limit(options?.limitCount || 100));
      }

      const snap = await getDocs(q);
      let list: Review[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Review, 'id'>),
      }));

      // In-memory filter for status & rating
      if (options?.rating) {
        list = list.filter(r => r.rating === options.rating);
      }
      if (options?.status && options.status !== 'all') {
        list = list.filter(r => r.status === options.status);
      }

      return list;
    } catch (err) {
      if (import.meta.env.DEV) console.warn('getAdminReviews error:', err);
      return [];
    }
  },

  /**
   * Admin Moderates a Review:
   * IMPORTANT: Reviews must NOT be hidden or removed solely because they express negative opinions (1-2 stars).
   * Moderation is reserved for spam, harassment, threats, or illegal content.
   */
  async moderateReview(
    reviewId: string,
    action: 'hide' | 'publish' | 'delete',
    reason: string,
    adminUid: string,
    adminEmail: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const snap = await getDoc(reviewRef);
      if (!snap.exists()) {
        return { success: false, message: 'المراجعة غير موجودة.' };
      }
      const data = snap.data() as Review;
      const novelId = data.novelId;
      const novelRef = doc(db, 'novels', novelId);

      const moderationFields = {
        status: action === 'hide' ? 'hidden' : 'published',
        moderationReason: reason || (action === 'hide' ? 'مخالفة سياسة النشر' : ''),
        moderatedAt: serverTimestamp(),
        moderatedBy: adminEmail,
      };

      // Fast path: adjust the aggregates by this one review inside a transaction.
      // Falls back to a full recalculation when the stored aggregates are inconsistent.
      try {
        await runTransaction(db, async tx => {
          const novelSnap = await tx.get(novelRef);
          const reviewSnap = await tx.get(reviewRef);
          if (!reviewSnap.exists()) throw new ReviewFlowError('المراجعة غير موجودة.');

          const current = reviewSnap.data() as Review;
          const star = asStar(current.rating);
          const oldCounted = current.status === 'published' ? star : null;
          const newCounted = action === 'publish' ? star : null;

          if (action === 'delete') tx.delete(reviewRef);
          else tx.update(reviewRef, moderationFields);

          if (oldCounted !== newCounted && novelSnap.exists()) {
            const agg = applyRatingChange(novelSnap.data() as Novel, oldCounted, newCounted);
            tx.update(novelRef, { ...agg, updatedAt: serverTimestamp() });
          }
        });
        clientCache.invalidate(`novel_${novelId}`);
        await novelService.syncNovelToCatalog(novelId);
      } catch (txErr) {
        if (txErr instanceof ReviewFlowError) throw txErr;
        if (import.meta.env.DEV) console.warn('Incremental moderation failed, falling back to full recalculation:', txErr);
        if (action === 'delete') {
          await deleteDoc(reviewRef);
        } else {
          await updateDoc(reviewRef, moderationFields);
        }
        await this.recalculateNovelAggregates(novelId);
      }

      // Audit Log
      const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'auditLogs', auditId), {
        id: auditId,
        adminUid,
        adminEmail,
        action: action === 'delete' ? 'delete_review' : action === 'hide' ? 'hide_review' : 'publish_review',
        targetType: 'review',
        targetId: reviewId,
        targetLabel: `${data.userName} - ${data.novelTitle || novelId} (${data.rating}★)`,
        details: { reason, previousStatus: data.status, rating: data.rating },
        timestamp: serverTimestamp(),
      });

      return { success: true, message: 'تم تنفيذ إجراء الإشراف وتحديث المتوسطات الحسابية بنجاح.' };
    } catch (err) {
      if (import.meta.env.DEV) console.error('moderateReview error:', err);
      return { success: false, message: 'حدث خطأ أثناء تنفيذ الإجراء.' };
    }
  },

  /**
   * Fetches user-submitted moderation reports.
   */
  async getModerationReports(statusFilter?: 'pending' | 'resolved' | 'dismissed' | 'all'): Promise<ModerationReport[]> {
    try {
      let q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100));
      if (statusFilter && statusFilter !== 'all') {
        q = query(collection(db, 'reports'), where('status', '==', statusFilter), limit(100));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<ModerationReport, 'id'>),
      }));
    } catch (err) {
      if (import.meta.env.DEV) console.warn('getModerationReports error:', err);
      return [];
    }
  },

  /**
   * Resolves or dismisses a moderation report.
   */
  async resolveReport(
    reportId: string,
    status: 'resolved' | 'dismissed',
    resolutionNote: string,
    adminUid: string,
    adminEmail: string
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status,
        resolutionNote: resolutionNote || '',
        resolvedAt: serverTimestamp(),
      });

      const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'auditLogs', auditId), {
        id: auditId,
        adminUid,
        adminEmail,
        action: 'resolve_report',
        targetType: 'report',
        targetId: reportId,
        details: { status, resolutionNote },
        timestamp: serverTimestamp(),
      });

      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('resolveReport error:', err);
      return false;
    }
  },

  /**
   * ADMIN ONLY. Full resync of every novel's rating aggregates from its published reviews,
   * then refreshes catalog/home. Use after migrating old data or if the numbers ever look off.
   */
  async resyncAllNovelAggregates(): Promise<number> {
    const novelsSnap = await getDocs(collection(db, 'novels'));
    let done = 0;
    for (const n of novelsSnap.docs) {
      await this.recalculateNovelAggregates(n.id);
      done++;
    }
    return done;
  },

  /**
   * ADMIN ONLY, one-off. Removes the `userEmail` field that earlier versions stored on public
   * review documents. Returns how many reviews were cleaned.
   */
  async scrubReviewEmails(): Promise<number> {
    const snap = await getDocs(collection(db, 'reviews'));
    const dirty = snap.docs.filter(d => Object.prototype.hasOwnProperty.call(d.data(), 'userEmail'));
    for (let i = 0; i < dirty.length; i += 400) {
      const batch = writeBatch(db);
      dirty.slice(i, i + 400).forEach(d => batch.update(d.ref, { userEmail: deleteField() }));
      await batch.commit();
    }
    return dirty.length;
  },
};
