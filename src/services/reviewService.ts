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
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { clientCache } from '../lib/cache';
import { Review, ModerationReport, RatingDistribution, Novel } from '../types';
import { settingsService } from './settingsService';

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
   * Recalculates genuine visitor rating aggregates from all published reviews of a novel.
   * Never fabricates reviews or merges editorial ratings into genuine visitor averages.
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
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Could not update novel aggregates document:', err);
    }

    return { average, count, distribution };
  },

  /**
   * Submits or updates a visitor's genuine rating and review.
   * Checks permissions, spam rate limits, and novel active status.
   */
  async submitOrUpdateReview(params: {
    novelId: string;
    novelTitle: string;
    userId: string;
    userName: string;
    userEmail?: string;
    rating: number;
    reviewText?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { novelId, novelTitle, userId, userName, userEmail, rating, reviewText } = params;

    // Validation
    const cleanRating = Math.min(5, Math.max(1, Math.round(rating)));
    if (!cleanRating || isNaN(cleanRating)) {
      return { success: false, error: 'التقييم يجب أن يكون بين 1 و 5 نجوم.' };
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

    // Check novel-specific toggle
    try {
      const novelSnap = await getDoc(doc(db, 'novels', novelId));
      if (novelSnap.exists()) {
        const nData = novelSnap.data() as Novel;
        if (nData.ratingsEnabled === false) {
          return { success: false, error: 'التقييمات والمراجعات مغلقة حالياً لهذه الرواية.' };
        }
      }
    } catch {
      // Proceed
    }

    // Rate limiting: check recent reviews created by this user today
    const maxDaily = settings.maxReviewsPerDayPerUser || 5;
    try {
      const userReviewsQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId),
        limit(20)
      );
      const userReviewsSnap = await getDocs(userReviewsQuery);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      let countToday = 0;
      userReviewsSnap.forEach(snap => {
        const d = snap.data();
        const createdMs = d.createdAt?.toMillis ? d.createdAt.toMillis() : (d.createdAt ? new Date(d.createdAt).getTime() : 0);
        if (createdMs > oneDayAgo && snap.id !== this.getReviewDocId(novelId, userId)) {
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

    const docId = this.getReviewDocId(novelId, userId);
    const existingSnap = await getDoc(doc(db, 'reviews', docId));
    const now = serverTimestamp();

    const reviewPayload: Partial<Review> = {
      id: docId,
      novelId,
      novelTitle: novelTitle.slice(0, 100),
      userId,
      userName: (userName || 'قارئ').slice(0, 60),
      userEmail: userEmail || '',
      rating: cleanRating,
      reviewText: (reviewText || '').trim().slice(0, 1000),
      status: 'published',
      updatedAt: now,
    };

    if (!existingSnap.exists()) {
      reviewPayload.createdAt = now;
      reviewPayload.reportCount = 0;
    }

    await setDoc(doc(db, 'reviews', docId), reviewPayload, { merge: true });

    // Recalculate aggregates for this novel
    await this.recalculateNovelAggregates(novelId);

    return { success: true };
  },

  /**
   * Deletes a visitor's own review.
   */
  async deleteUserReview(novelId: string, userId: string): Promise<boolean> {
    try {
      const docId = this.getReviewDocId(novelId, userId);
      await deleteDoc(doc(db, 'reviews', docId));
      await this.recalculateNovelAggregates(novelId);
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
      const snap = await getDoc(doc(db, 'reviews', reviewId));
      if (!snap.exists()) {
        return { success: false, message: 'المراجعة غير موجودة.' };
      }
      const data = snap.data() as Review;
      const novelId = data.novelId;

      if (action === 'delete') {
        await deleteDoc(doc(db, 'reviews', reviewId));
      } else {
        await updateDoc(doc(db, 'reviews', reviewId), {
          status: action === 'hide' ? 'hidden' : 'published',
          moderationReason: reason || (action === 'hide' ? 'مخالفة سياسة النشر' : ''),
          moderatedAt: serverTimestamp(),
          moderatedBy: adminEmail,
        });
      }

      // Automatically recalculate novel genuine rating aggregates
      // to reflect published reviews only!
      await this.recalculateNovelAggregates(novelId);

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
};
