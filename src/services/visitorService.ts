import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Review, AuditLogEntry, AccountStatus } from '../types';
import { reviewService } from './reviewService';

export const visitorService = {
  /**
   * Fetches visitors/registered users with optional search and status filter.
   */
  async getVisitors(options?: {
    search?: string;
    statusFilter?: string;
    limitCount?: number;
  }): Promise<UserProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      let list: UserProfile[] = [];

      snap.forEach(d => {
        list.push({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) });
      });

      // Filter by search query
      if (options?.search) {
        const q = options.search.toLowerCase().trim();
        list = list.filter(u =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          u.uid.toLowerCase().includes(q)
        );
      }

      // Filter by status
      if (options?.statusFilter && options.statusFilter !== 'all') {
        list = list.filter(u => {
          const s = u.status || 'active';
          return s === options.statusFilter;
        });
      }

      return list;
    } catch (err) {
      if (import.meta.env.DEV) console.warn('getVisitors error:', err);
      return [];
    }
  },

  /**
   * Fetches all reviews submitted by a specific visitor.
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Review, 'id'>),
      }));
    } catch (err) {
      if (import.meta.env.DEV) console.warn('getUserReviews error:', err);
      return [];
    }
  },

  /**
   * Updates an account's status (active, restricted, deactivated) with optional restriction reason.
   */
  async updateAccountStatus(
    userId: string,
    targetStatus: AccountStatus,
    reason: string | undefined,
    adminUid: string,
    adminEmail: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return { success: false, message: 'المستخدم غير موجود.' };
      }
      const uData = userSnap.data() as UserProfile;

      await updateDoc(userRef, {
        status: targetStatus,
        restrictedReason: targetStatus === 'restricted' ? (reason || 'مخالفة قواعد المنصة') : '',
        restrictedAt: targetStatus === 'restricted' ? serverTimestamp() : null,
      });

      // Log in audit trail
      const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const actionType =
        targetStatus === 'restricted'
          ? 'restrict_user'
          : targetStatus === 'deactivated'
          ? 'deactivate_user'
          : 'restore_user';

      await setDoc(doc(db, 'auditLogs', auditId), {
        id: auditId,
        adminUid,
        adminEmail,
        action: actionType,
        targetType: 'user',
        targetId: userId,
        targetLabel: `${uData.name || 'مستخدم'} (${uData.email})`,
        details: { previousStatus: uData.status || 'active', newStatus: targetStatus, reason },
        timestamp: serverTimestamp(),
      });

      return { success: true, message: 'تم تحديث حالة الحساب بنجاح.' };
    } catch (err) {
      if (import.meta.env.DEV) console.error('updateAccountStatus error:', err);
      return { success: false, message: 'حدث خطأ أثناء تعديل حالة الحساب.' };
    }
  },

  /**
   * Deletes a visitor account through a safe process that cleans up associated data
   * and recalculates novel rating aggregates so statistics stay accurate.
   */
  async deleteAccountSafely(
    userId: string,
    adminUid: string,
    adminEmail: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const uData = userSnap.exists() ? (userSnap.data() as UserProfile) : null;

      // 1. Find and delete all reviews created by this user
      const reviewsQ = query(collection(db, 'reviews'), where('userId', '==', userId));
      const reviewsSnap = await getDocs(reviewsQ);
      const affectedNovelIds = new Set<string>();

      for (const revDoc of reviewsSnap.docs) {
        const revData = revDoc.data() as Review;
        affectedNovelIds.add(revData.novelId);
        await deleteDoc(revDoc.ref);
      }

      // 2. Recalculate rating aggregates for each affected novel
      for (const nId of affectedNovelIds) {
        await reviewService.recalculateNovelAggregates(nId);
      }

      // 3. Delete user document
      await deleteDoc(userRef);

      // 4. Log in audit trail
      const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'auditLogs', auditId), {
        id: auditId,
        adminUid,
        adminEmail,
        action: 'delete_user',
        targetType: 'user',
        targetId: userId,
        targetLabel: uData ? `${uData.name} (${uData.email})` : userId,
        details: { deletedReviewsCount: reviewsSnap.size, affectedNovels: Array.from(affectedNovelIds) },
        timestamp: serverTimestamp(),
      });

      return {
        success: true,
        message: `تم حذف الحساب وتنظيف ${reviewsSnap.size} مراجعة وتحديث متوسطات الروايات بنجاح.`,
      };
    } catch (err) {
      if (import.meta.env.DEV) console.error('deleteAccountSafely error:', err);
      return { success: false, message: 'حدث خطأ أثناء حذف الحساب.' };
    }
  },

  /**
   * Fetches administrative audit log entries.
   */
  async getAuditLogs(limitCount: number = 50): Promise<AuditLogEntry[]> {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<AuditLogEntry, 'id'>),
      }));
    } catch (err) {
      if (import.meta.env.DEV) console.warn('getAuditLogs error:', err);
      return [];
    }
  },
};
