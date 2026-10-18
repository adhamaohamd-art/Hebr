import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { clientCache } from '../lib/cache';
import { SiteSettings, Plan, Coupon } from '../types';

export const defaultSettings: SiteSettings = {
  siteName: 'حَبْر',
  logoText: 'منصة الحكايات',
  vodafoneCashNumber: '',
  instapayHandle: '',
  paymentInstructions: '',
  contactEmail: '',
  ratingsRequireAuth: true,
  globalRatingsEnabled: true,
  maxReviewsPerDayPerUser: 5,
  minReviewLength: 0,
  maxReviewLength: 1000,
  writerSharePercent: 70,
};

export const settingsService = {
  /**
   * Fetches public site settings (cached for 10 min).
   */
  async getSettings(): Promise<SiteSettings> {
    try {
      return await clientCache.getOrFetch('site_settings', async () => {
        const snap = await getDoc(doc(db, 'settings', 'site'));
        if (!snap.exists()) return defaultSettings;
        return { ...defaultSettings, ...(snap.data() as Partial<SiteSettings>) };
      });
    } catch {
      return defaultSettings;
    }
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<void> {
    await setDoc(doc(db, 'settings', 'site'), JSON.parse(JSON.stringify(settings)), { merge: true });
    clientCache.invalidate('site_settings');
  },

  /**
   * Fetches subscription plans (cached for 10 min).
   */
  async getPlans(): Promise<Plan[]> {
    return clientCache.getOrFetch('site_plans', async () => {
      const snap = await getDocs(collection(db, 'plans'));
      const list: Plan[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...(d.data() as Omit<Plan, 'id'>) });
      });
      return list;
    });
  },

  async savePlan(plan: Partial<Plan>, planId?: string): Promise<string> {
    const id = planId || doc(collection(db, 'plans')).id;
    const clean: Record<string, unknown> = { ...plan };
    delete clean.id;
    await setDoc(doc(db, 'plans', id), JSON.parse(JSON.stringify(clean)), { merge: true });
    clientCache.invalidate('site_plans');
    return id;
  },

  async deletePlan(planId: string): Promise<void> {
    await deleteDoc(doc(db, 'plans', planId));
    clientCache.invalidate('site_plans');
  },

  async getCoupons(): Promise<Coupon[]> {
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      const list: Coupon[] = [];
      snap.forEach(d => {
        list.push({ code: d.id, ...(d.data() as Omit<Coupon, 'code'>) });
      });
      return list;
    } catch {
      return [];
    }
  },

  async saveCoupon(coupon: Partial<Coupon>): Promise<void> {
    if (!coupon.code) return;
    const code = coupon.code.toUpperCase().trim();
    await setDoc(doc(db, 'coupons', code), { ...coupon, code }, { merge: true });
  },

  async deleteCoupon(code: string): Promise<void> {
    await deleteDoc(doc(db, 'coupons', code.toUpperCase().trim()));
  },
};
