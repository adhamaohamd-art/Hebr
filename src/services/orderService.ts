import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { libraryService } from './libraryService';
import { sanitizeSingleLine, isValidEgyptianPhone, isValidTransactionRef } from '../lib/sanitize';
import { LIMITS } from '../config';
import { Order, OrderItem, PaymentMethod, Coupon } from '../types';

export interface CreateOrderInput {
  userId: string;
  userEmail: string;
  userName?: string;
  items: OrderItem[];
  total: number;
  discount?: number;
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  senderPhone: string;
  transactionRef: string;
  note?: string;
}

export const orderService = {
  /**
   * Validate coupon code.
   * Single read on coupons/{code}. Non-admins can only get by exact ID (no enumeration).
   */
  async validateCoupon(code: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
    try {
      const codeClean = sanitizeSingleLine(code).toUpperCase().slice(0, LIMITS.couponCodeMax);
      if (!codeClean) {
        return { valid: false, error: 'كود الكوبون فارغ' };
      }
      const snap = await getDoc(doc(db, 'coupons', codeClean));
      if (!snap.exists()) {
        return { valid: false, error: 'كوبون الخصم غير موجود' };
      }
      const coupon = { code: snap.id, ...(snap.data() as Omit<Coupon, 'code'>) };
      if (!coupon.active) {
        return { valid: false, error: 'كوبون الخصم غير نشط' };
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
        return { valid: false, error: 'انتهت صلاحية كوبون الخصم' };
      }
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return { valid: false, error: 'تم استهلاك الحد الأقصى لاستخدام هذا الكوبون' };
      }
      return { valid: true, coupon };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Coupon validation error:', err);
      }
      return { valid: false, error: 'تعذر التحقق من الكوبون' };
    }
  },

  /**
   * Creates an order with manual transfer details (no storage uploads).
   * Enforces:
   * - Egyptian phone format
   * - Transaction reference format (6-30 chars)
   * - Maximum 3 pending orders per user
   * - Sanitized note max 140 chars
   */
  async createOrder(input: CreateOrderInput): Promise<string> {
    const cleanPhone = sanitizeSingleLine(input.senderPhone);
    const cleanRef = sanitizeSingleLine(input.transactionRef);
    const cleanNote = input.note ? sanitizeSingleLine(input.note).slice(0, LIMITS.noteMax) : '';

    if (!isValidEgyptianPhone(cleanPhone)) {
      throw new Error('رقم الهاتف غير صالح. يجب أن يبدأ بـ 01 ويتكون من 11 رقماً.');
    }
    if (!isValidTransactionRef(cleanRef)) {
      throw new Error('الرقم المرجعي للتحويل غير صالح. يجب أن يتكون من 6 إلى 30 حرفاً أو رقماً.');
    }

    // Check pending orders limit (max 3 pending orders per user)
    const existingOrders = await this.getOrders(input.userId);
    const pendingCount = existingOrders.filter(o => o.status === 'pending').length;
    if (pendingCount >= LIMITS.maxPendingOrdersPerUser) {
      throw new Error('لديك 3 طلبات معلقة بالفعل قيد المراجعة. يرجى انتظار معالجتها أولاً.');
    }

    const orderId = doc(collection(db, 'orders')).id;

    const orderData: Omit<Order, 'id'> = {
      userId: input.userId,
      userEmail: input.userEmail,
      userName: sanitizeSingleLine(input.userName || input.userEmail.split('@')[0]),
      items: input.items.slice(0, 10), // Limit items 1-10
      total: Math.max(0, input.total),
      discount: Math.max(0, input.discount || 0),
      couponCode: input.couponCode ? sanitizeSingleLine(input.couponCode).toUpperCase() : null,
      paymentMethod: input.paymentMethod,
      senderPhone: cleanPhone,
      transactionRef: cleanRef,
      note: cleanNote,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'orders', orderId), orderData);
    return orderId;
  },

  /**
   * Fetches orders.
   * If userId is provided, filters for that user.
   */
  async getOrders(userId?: string): Promise<Order[]> {
    try {
      const colRef = collection(db, 'orders');
      // Regular users may only read their own orders (rules), so the query itself must be
      // filtered by userId; a whole-collection query is denied for non-admins.
      // A single-field equality filter needs no composite index, so this works even before indexes
      // are deployed; a user has few orders, so sorting newest-first in memory is cheap.
      const q = userId
        ? query(colRef, where('userId', '==', userId))
        : query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: Order[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...(d.data() as Omit<Order, 'id'>) });
      });
      if (userId) {
        const ms = (o: Order) => (o.createdAt as { toMillis?: () => number } | null)?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
        list.sort((a, b) => ms(b) - ms(a));
      }
      return list;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Firestore getOrders notice:', err);
      }
      // A user's own orders must never silently look empty (it would bypass the pending-order limit).
      if (userId) throw err;
      return [];
    }
  },

  /**
   * Atomic Approval:
   * Approves order in ONE single writeBatch:
   * 1. Updates order status to 'approved'
   * 2. Grants entitlements ('novel' or 'book')
   * 3. Sets subscription if a plan item is included
   * 4. Increments coupon usedCount atomically (if coupon used)
   */
  async approveOrder(order: Order, adminNote?: string): Promise<void> {
    const batch = writeBatch(db);
    const orderRef = doc(db, 'orders', order.id);

    // 1. Order status
    batch.update(orderRef, {
      status: 'approved',
      reviewedAt: serverTimestamp(),
      adminNote: adminNote || 'تمت الموافقة وتفعيل الصلاحيات',
    });

    // 2. Entitlements & subscriptions
    for (const item of order.items) {
      if (item.type === 'novel' || item.type === 'book') {
        const entitlementRef = doc(db, 'users', order.userId, 'entitlements', item.refId);
        batch.set(
          entitlementRef,
          {
            novelId: item.refId,
            type: item.type,
            grantedAt: serverTimestamp(),
            orderId: order.id,
          },
          { merge: true }
        );
      } else if (item.type === 'plan') {
        const isYearly = item.price > 150;
        const durationDays = isYearly ? 365 : 30;
        const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;

        const userRef = doc(db, 'users', order.userId);
        batch.set(
          userRef,
          {
            subscription: {
              planId: item.refId,
              planName: item.title,
              expiresAt,
            },
          },
          { merge: true }
        );
      }
    }

    // 3. Atomically increment coupon count
    if (order.couponCode) {
      const couponRef = doc(db, 'coupons', order.couponCode.toUpperCase());
      batch.update(couponRef, {
        usedCount: increment(1),
      });
    }

    await batch.commit();
    libraryService.invalidateEntitlementCache(order.userId);
  },

  /**
   * Rejects an order with admin note.
   */
  async rejectOrder(orderId: string, adminNote?: string): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    await setDoc(
      orderRef,
      {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        adminNote: adminNote || 'تم رفض الطلب. يرجى مراجعة تفاصيل التحويل.',
      },
      { merge: true }
    );
  },
};
