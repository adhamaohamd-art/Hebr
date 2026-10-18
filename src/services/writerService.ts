import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  Timestamp,
  DocumentReference,
  deleteDoc,
  setDoc,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { db, refreshAuthToken } from '../lib/firebase';
import { clientCache } from '../lib/cache';
import { normalizeHttpsUrl, sanitizeMultiLine, sanitizeSingleLine } from '../lib/sanitize';
import { genreFieldsForSave } from '../lib/genres';
import { LIMITS } from '../config';
import { Novel, ChapterMeta, ChapterSummaryItem, NovelReviewStatus, WriterStats, Coupon, Sale, PlanRequest } from '../types';
import { releaseStatus, formatWait } from '../lib/releaseSchedule';

/**
 * Everything a WRITER (كاتب) can do. Mirrors the writer rules in firestore.rules:
 *  - a novel is created as a private draft (published=false, price 0) in the SAME batch that moves
 *    writerStats/{uid}.novelCount by +1 (the rules check that it stays within the quota);
 *  - descriptive fields and chapters can be edited, the novel can be sent for review;
 *  - the writer sets the price / free chapters / free-novel flag of their OWN novels (unless the admin locked
 *    the price) and releases chapters on a cadence: first 3 any time, then 1 every 3 days;
 *  - making a novel public (published) and the public catalog stay with the admin.
 */

export interface WriterPricingInput {
  novelPrice: number;
  bookPrice: number | null;
  freeChapters: number;
  isFreeNovel: boolean;
}

export interface WriterCouponInput {
  code: string;
  novelId: string;
  type: 'percent' | 'fixed';
  value: number;
  maxUses: number;
  expiresAt: string | null;
  active: boolean;
}

export interface WriterNovelInput {
  title: string;
  titleEn?: string;
  author: string;
  authorEn?: string;
  genres: string[];
  status: 'مستمرة' | 'مكتملة';
  description: string;
  descriptionEn?: string;
  coverUrl?: string;
  color?: string;
  accent?: string;
}

export interface WriterChapterInput {
  number: number;
  title: string;
  titleEn?: string;
  published: boolean;
  body: string;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return 0;
}

function cleanNovelFields(input: WriterNovelInput): Record<string, unknown> {
  const title = sanitizeSingleLine(input.title).slice(0, LIMITS.novelTitleMax);
  if (!title) throw new Error('اكتب عنوان الرواية.');

  const author = sanitizeSingleLine(input.author).slice(0, LIMITS.authorMax);
  if (!author) throw new Error('اكتب اسم الكاتب (الاسم الذي سيظهر على الرواية).');

  const description = sanitizeMultiLine(input.description).slice(0, LIMITS.descriptionMax);
  if (!description) throw new Error('اكتب وصفًا قصيرًا للرواية.');

  const cover = normalizeHttpsUrl(input.coverUrl);
  if (cover === null) {
    throw new Error('رابط الغلاف غير صالح. يجب أن يبدأ بـ https:// وأن يكون رابط صورة صحيحًا.');
  }

  const genreFields = genreFieldsForSave(input.genres);
  if (genreFields.genres.length === 0) throw new Error('اختر تصنيفًا واحدًا على الأقل.');

  return {
    title,
    titleEn: sanitizeSingleLine(input.titleEn || '').slice(0, LIMITS.novelTitleMax),
    author,
    authorEn: sanitizeSingleLine(input.authorEn || '').slice(0, LIMITS.authorMax),
    ...genreFields,
    status: input.status === 'مكتملة' ? 'مكتملة' : 'مستمرة',
    description,
    descriptionEn: sanitizeMultiLine(input.descriptionEn || '').slice(0, LIMITS.descriptionMax),
    coverUrl: cover,
    color: input.color || '#314f49',
    accent: input.accent || '#d9bb91',
  };
}

export const writerService = {
  /** How many novels this writer owns right now (writerStats/{uid}.novelCount). */
  async getStats(uid: string): Promise<WriterStats> {
    const snap = await getDoc(doc(db, 'writerStats', uid));
    if (!snap.exists()) return { novelCount: 0 };
    const d = snap.data() as WriterStats;
    return { ...d, novelCount: Math.max(0, Math.floor(Number(d.novelCount) || 0)) };
  },

  /** The writer's own novels (any review status), newest first. */
  async getMyNovels(uid: string): Promise<Novel[]> {
    const snap = await getDocs(query(collection(db, 'novels'), where('ownerId', '==', uid)));
    const list: Novel[] = [];
    snap.forEach(d => list.push({ id: d.id, ...(d.data() as Omit<Novel, 'id'>) }));
    const ms = (n: Novel) => n.createdAtMs || toMillis(n.createdAt);
    return list.sort((a, b) => ms(b) - ms(a));
  },

  /**
   * Creates a private draft novel AND moves the quota counter by +1 in one batch.
   * firestore.rules reject the batch when the writer is already at their limit, so the check
   * cannot be skipped from the browser; `limit` here is only used for a friendly message.
   */
  async createNovel(uid: string, input: WriterNovelInput, limit: number): Promise<string> {
    const fields = cleanNovelFields(input);
    const stats = await this.getStats(uid);
    if (limit <= 0 || stats.novelCount >= limit) {
      throw new Error('وصلت للحد الأقصى من الروايات المسموح بها لحسابك.');
    }

    const novelRef = doc(collection(db, 'novels'));
    const nowMs = Date.now();
    const batch = writeBatch(db);
    batch.set(
      novelRef,
      stripUndefined({
        ...fields,
        ownerId: uid,
        published: false,
        reviewStatus: 'draft' as NovelReviewStatus,
        novelPrice: 0,
        bookPrice: null,
        freeChapters: 0,
        chaptersCount: 0,
        chaptersSummary: [],
        createdAt: serverTimestamp(),
        createdAtMs: nowMs,
        updatedAt: serverTimestamp(),
      })
    );
    batch.set(doc(db, 'writerStats', uid), {
      novelCount: stats.novelCount + 1,
      lastNovelId: novelRef.id,
      updatedAt: serverTimestamp(),
    });

    await refreshAuthToken();
    await batch.commit();
    return novelRef.id;
  },

  async updateNovel(novelId: string, input: WriterNovelInput): Promise<void> {
    const fields = cleanNovelFields(input);
    const batch = writeBatch(db);
    batch.update(doc(db, 'novels', novelId), stripUndefined({ ...fields, updatedAt: serverTimestamp() }));
    await refreshAuthToken();
    await batch.commit();
    clientCache.invalidate(`novel_${novelId}`);
  },

  /** draft/rejected -> pending (sent to the admin) or pending -> draft (taken back). */
  async setReviewStatus(novelId: string, status: 'draft' | 'pending'): Promise<void> {
    await refreshAuthToken();
    const batch = writeBatch(db);
    batch.update(doc(db, 'novels', novelId), { reviewStatus: status, updatedAt: serverTimestamp() });
    await batch.commit();
    clientCache.invalidate(`novel_${novelId}`);
  },

  /**
   * Deletes the novel with all its chapters, and gives the quota slot back (-1) in the same batch.
   * Chapters/contents go first; the novel and the counter go together at the end.
   */
  async deleteNovel(uid: string, novelId: string): Promise<void> {
    await refreshAuthToken();
    const chaptersSnap = await getDocs(collection(db, 'novels', novelId, 'chapters'));
    const refs: DocumentReference[] = [];
    chaptersSnap.forEach(d => {
      refs.push(d.ref);
      refs.push(doc(db, 'chapterContents', d.id));
    });
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(db);
      refs.slice(i, i + 400).forEach(r => batch.delete(r));
      await batch.commit();
    }

    const stats = await this.getStats(uid);
    const batch = writeBatch(db);
    batch.delete(doc(db, 'novels', novelId));
    batch.set(doc(db, 'writerStats', uid), {
      novelCount: Math.max(0, stats.novelCount - 1),
      lastNovelId: novelId,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    clientCache.invalidate(`novel_${novelId}`);
  },

  // -------------------------------------------------------------------------------- chapters

  async getChapters(novelId: string): Promise<ChapterMeta[]> {
    const snap = await getDocs(collection(db, 'novels', novelId, 'chapters'));
    const list: ChapterMeta[] = [];
    snap.forEach(d => list.push({ id: d.id, ...(d.data() as Omit<ChapterMeta, 'id'>) }));
    return list.sort((a, b) => (a.number || 0) - (b.number || 0));
  },

  async getChapterBody(chapterId: string): Promise<string> {
    const snap = await getDoc(doc(db, 'chapterContents', chapterId));
    return snap.exists() ? String((snap.data() as { body?: string }).body || '') : '';
  },

  async saveChapter(novelId: string, input: WriterChapterInput, chapterId?: string): Promise<string> {
    const number = Math.floor(Number(input.number));
    if (!Number.isFinite(number) || number < 1 || number > 500) throw new Error('رقم الفصل يجب أن يكون بين 1 و 500.');
    const title = sanitizeSingleLine(input.title).slice(0, LIMITS.chapterTitleMax);
    if (!title) throw new Error('اكتب عنوان الفصل.');
    const body = sanitizeMultiLine(input.body);
    if (!body) throw new Error('نص الفصل فارغ.');
    if (body.length > LIMITS.chapterBodyMax) {
      throw new Error(`نص الفصل أطول من الحد المسموح (${LIMITS.chapterBodyMax} حرف). قسّمه إلى فصلين.`);
    }

    const isNew = !chapterId;
    const id = chapterId || doc(collection(db, 'novels', novelId, 'chapters')).id;

    // Fresh state: the release cadence is decided on the novel's current counters.
    const [novelSnap, existing] = await Promise.all([getDoc(doc(db, 'novels', novelId)), this.getChapters(novelId)]);
    if (!novelSnap.exists()) throw new Error('الرواية غير موجودة.');
    const novelData = novelSnap.data() as Novel;
    const before = existing.find(c => c.id === id);
    const wasPublished = Boolean(before?.published);
    const willPublish = Boolean(input.published);
    const releasing = willPublish && !wasPublished;

    if (releasing) {
      const st = releaseStatus(novelData.releaseCount, toMillis(novelData.lastReleaseAt));
      if (!st.canRelease) {
        throw new Error(
          `لا يمكن نشر فصل جديد الآن. تستطيع نشر الفصل التالي بعد ${formatWait(st.waitMs, true)}. يمكنك حفظ هذا الفصل كمسودة وإتمامه لحين الموعد.`
        );
      }
    }

    const chapterFields = {
      novelId,
      number,
      title,
      titleEn: sanitizeSingleLine(input.titleEn || '').slice(0, LIMITS.chapterTitleMax),
      published: willPublish,
    };

    // The public chapter list as it will be AFTER this save (so the novel is updated in the same batch).
    const merged = existing.filter(c => c.id !== id).concat([{ ...(before || ({} as ChapterMeta)), ...chapterFields, id } as ChapterMeta]);
    const summary = this.buildSummary(merged);

    const batch = writeBatch(db);
    batch.set(
      doc(db, 'novels', novelId, 'chapters', id),
      {
        ...chapterFields,
        updatedAt: serverTimestamp(),
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: true }
    );
    batch.set(doc(db, 'chapterContents', id), { novelId, body }, { merge: true });
    batch.update(doc(db, 'novels', novelId), {
      chaptersSummary: summary,
      chaptersCount: summary.length,
      updatedAt: serverTimestamp(),
      // The rules require this bump in the same batch for any chapter that goes live.
      ...(releasing ? { releaseCount: increment(1), lastReleaseAt: serverTimestamp() } : {}),
    });

    await refreshAuthToken();
    await batch.commit();
    clientCache.invalidate(`chapter_content_${id}`);
    clientCache.invalidate(`novel_${novelId}`);
    return id;
  },

  async deleteChapter(novelId: string, chapterId: string): Promise<void> {
    await refreshAuthToken();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'novels', novelId, 'chapters', chapterId));
    batch.delete(doc(db, 'chapterContents', chapterId));
    await batch.commit();
    clientCache.invalidate(`chapter_content_${chapterId}`);
    await this.syncSummary(novelId);
  },

  /**
   * Refreshes chaptersSummary/chaptersCount on the novel document (what readers see). Writers cannot
   * touch catalog/home, so the card's chapter count there is refreshed when the admin republishes or
   * presses "rebuild catalog".
   */
  buildSummary(chapters: ChapterMeta[]): ChapterSummaryItem[] {
    return chapters
      .filter(c => c.published)
      .sort((x, y) => (x.number || 0) - (y.number || 0))
      .map(c =>
        stripUndefined({
          id: c.id,
          number: Number(c.number) || 0,
          title: c.title || '',
          titleEn: c.titleEn || undefined,
          isFree: Boolean(c.isFree),
        }) as ChapterSummaryItem
      );
  },

  async syncSummary(novelId: string): Promise<void> {
    const chapters = await this.getChapters(novelId);
    const summary = this.buildSummary(chapters);
    const batch = writeBatch(db);
    batch.update(doc(db, 'novels', novelId), {
      chaptersSummary: summary,
      chaptersCount: summary.length,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    clientCache.invalidate(`novel_${novelId}`);
  },

  // ------------------------------------------------------------------------------- pricing

  /** Price, free chapters and the free-novel flag of the writer's OWN novel (rules block it when priceLocked). */
  async updatePricing(novelId: string, input: WriterPricingInput): Promise<void> {
    const novelPrice = Number(input.novelPrice);
    if (!Number.isFinite(novelPrice) || novelPrice < 0 || novelPrice > 5000) throw new Error('سعر الرواية يجب أن يكون بين 0 و 5000 جنيه.');
    const bookRaw = input.bookPrice;
    const bookPrice = bookRaw === null || bookRaw === undefined || Number.isNaN(Number(bookRaw)) ? null : Number(bookRaw);
    if (bookPrice !== null && (bookPrice < 0 || bookPrice > 5000)) throw new Error('سعر الكتاب الرقمي يجب أن يكون بين 0 و 5000 جنيه.');
    const freeChapters = Math.floor(Number(input.freeChapters) || 0);
    if (freeChapters < 0 || freeChapters > 500) throw new Error('عدد الفصول المجانية يجب أن يكون بين 0 و 500.');

    await refreshAuthToken();
    const batch = writeBatch(db);
    batch.update(doc(db, 'novels', novelId), {
      novelPrice,
      bookPrice,
      freeChapters,
      isFreeNovel: Boolean(input.isFreeNovel),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    clientCache.invalidate(`novel_${novelId}`);
  },

  // -------------------------------------------------------------------------------- earnings

  /** Sales rows of this writer, newest first. */
  async getMySales(uid: string): Promise<Sale[]> {
    const snap = await getDocs(query(collection(db, 'sales'), where('ownerId', '==', uid)));
    const list: Sale[] = [];
    snap.forEach(d => list.push({ id: d.id, ...(d.data() as Omit<Sale, 'id'>) }));
    return list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  },

  // -------------------------------------------------------------------------------- coupons

  async getMyCoupons(uid: string): Promise<Coupon[]> {
    const snap = await getDocs(query(collection(db, 'coupons'), where('ownerId', '==', uid)));
    const list: Coupon[] = [];
    snap.forEach(d => list.push({ code: d.id, ...(d.data() as Omit<Coupon, 'code'>) }));
    return list;
  },

  async saveCoupon(uid: string, input: WriterCouponInput, isEdit: boolean): Promise<void> {
    const code = sanitizeSingleLine(input.code).toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, LIMITS.couponCodeMax);
    if (code.length < 3) throw new Error('كود الخصم يجب أن يكون 3 أحرف أو أرقام إنجليزية على الأقل.');
    const value = Number(input.value);
    if (!Number.isFinite(value) || value <= 0) throw new Error('قيمة الخصم يجب أن تكون أكبر من صفر.');
    if (input.type === 'percent' && value > 90) throw new Error('نسبة الخصم لا تزيد عن 90%.');
    if (!input.novelId) throw new Error('اختر الرواية التي ينطبق عليها الخصم.');
    const maxUses = Math.max(0, Math.floor(Number(input.maxUses) || 0));

    const ref = doc(db, 'coupons', code);
    if (!isEdit && (await getDoc(ref)).exists()) throw new Error('هذا الكود مستخدم بالفعل. اختر كودًا آخر.');

    const data: Record<string, unknown> = {
      code,
      type: input.type,
      value,
      active: Boolean(input.active),
      expiresAt: input.expiresAt || null,
      maxUses,
      ownerId: uid,
      novelId: input.novelId,
    };
    if (!isEdit) data.usedCount = 0;
    await refreshAuthToken();
    await setDoc(ref, data, { merge: isEdit });
  },

  async deleteCoupon(code: string): Promise<void> {
    await refreshAuthToken();
    await deleteDoc(doc(db, 'coupons', code));
  },

  // ------------------------------------------------------------- requests to join plans

  async getMyPlanRequests(uid: string): Promise<PlanRequest[]> {
    const snap = await getDocs(query(collection(db, 'planRequests'), where('ownerId', '==', uid)));
    const list: PlanRequest[] = [];
    snap.forEach(d => list.push({ id: d.id, ...(d.data() as Omit<PlanRequest, 'id'>) }));
    return list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  },

  async requestPlan(uid: string, ownerName: string, novel: Pick<Novel, 'id' | 'title'>, plan: { id: string; name: string }): Promise<void> {
    await refreshAuthToken();
    const ref = doc(db, 'planRequests', `${novel.id}_${plan.id}`);
    // A rejected request can be sent again: remove the old one first (only the admin may update it).
    const old = await getDoc(ref);
    if (old.exists()) {
      if ((old.data() as { status?: string }).status !== 'rejected') throw new Error('لديك طلب سابق لهذه الباقة بالفعل.');
      await deleteDoc(ref);
    }
    await setDoc(ref, {
      novelId: novel.id,
      novelTitle: novel.title,
      planId: plan.id,
      planName: plan.name,
      ownerId: uid,
      ownerName: ownerName.slice(0, 80),
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  },

  async cancelPlanRequest(requestId: string): Promise<void> {
    await refreshAuthToken();
    await deleteDoc(doc(db, 'planRequests', requestId));
  },
};

/** Admin side: approving a request adds the novel to the plan (arrayUnion) and closes the request. */
export const planRequestAdmin = {
  async list(): Promise<PlanRequest[]> {
    const snap = await getDocs(collection(db, 'planRequests'));
    const list: PlanRequest[] = [];
    snap.forEach(d => list.push({ id: d.id, ...(d.data() as Omit<PlanRequest, 'id'>) }));
    return list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  },

  async approve(req: PlanRequest): Promise<void> {
    const batch = writeBatch(db);
    batch.set(doc(db, 'plans', req.planId), { novelIds: arrayUnion(req.novelId) }, { merge: true });
    batch.update(doc(db, 'planRequests', req.id), { status: 'approved', reviewedAt: serverTimestamp() });
    await batch.commit();
    clientCache.invalidate('site_plans');
  },

  async reject(req: PlanRequest, note: string): Promise<void> {
    await setDoc(
      doc(db, 'planRequests', req.id),
      { status: 'rejected', adminNote: sanitizeSingleLine(note).slice(0, 200), reviewedAt: serverTimestamp() },
      { merge: true }
    );
  },
};
