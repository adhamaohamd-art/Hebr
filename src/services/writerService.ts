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
} from 'firebase/firestore';
import { db, refreshAuthToken } from '../lib/firebase';
import { clientCache } from '../lib/cache';
import { normalizeHttpsUrl, sanitizeMultiLine, sanitizeSingleLine } from '../lib/sanitize';
import { genreFieldsForSave } from '../lib/genres';
import { LIMITS } from '../config';
import { Novel, ChapterMeta, ChapterSummaryItem, NovelReviewStatus, WriterStats } from '../types';

/**
 * Everything a WRITER (كاتب) can do. Mirrors the writer rules in firestore.rules:
 *  - a novel is created as a private draft (published=false, price 0) in the SAME batch that moves
 *    writerStats/{uid}.novelCount by +1 (the rules check that it stays within the quota);
 *  - descriptive fields and chapters can be edited, the novel can be sent for review;
 *  - publishing, pricing, free flags and the public catalog stay with the admin.
 */

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

    const batch = writeBatch(db);
    batch.set(
      doc(db, 'novels', novelId, 'chapters', id),
      {
        novelId,
        number,
        title,
        titleEn: sanitizeSingleLine(input.titleEn || '').slice(0, LIMITS.chapterTitleMax),
        published: Boolean(input.published),
        updatedAt: serverTimestamp(),
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: true }
    );
    batch.set(doc(db, 'chapterContents', id), { novelId, body }, { merge: true });

    await refreshAuthToken();
    await batch.commit();
    clientCache.invalidate(`chapter_content_${id}`);
    await this.syncSummary(novelId);
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
  async syncSummary(novelId: string): Promise<void> {
    const chapters = await this.getChapters(novelId);
    const summary: ChapterSummaryItem[] = chapters
      .filter(c => c.published)
      .map(c =>
        stripUndefined({
          id: c.id,
          number: Number(c.number) || 0,
          title: c.title || '',
          titleEn: c.titleEn || undefined,
          isFree: Boolean(c.isFree),
        }) as ChapterSummaryItem
      );
    const batch = writeBatch(db);
    batch.update(doc(db, 'novels', novelId), {
      chaptersSummary: summary,
      chaptersCount: summary.length,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    clientCache.invalidate(`novel_${novelId}`);
  },
};
