import { novelHasGenre, genreFieldsForSave } from '../lib/genres';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  runTransaction,
  Timestamp,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { clientCache } from '../lib/cache';
import {
  Novel,
  CatalogNovel,
  CatalogDoc,
  ChapterMeta,
  ChapterContent,
  ChapterSummaryItem,
  AdminRatingDistribution,
  RatingDisplayMode,
} from '../types';
import { calculateAdminRatingStats, validRating } from '../lib/rating';

/**
 * Firestore REJECTS any field whose value is `undefined` (even nested inside arrays/objects).
 * This helper removes them so optional fields (titleEn, rating, coverUrl, ...) never break a write.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(v => stripUndefined(v)) as unknown as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Timestamp) && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

/** Best-effort conversion of a Firestore createdAt (Timestamp / ms / Date) to milliseconds. */
function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return 0;
}

function novelCreatedMs(n: { createdAtMs?: number; createdAt?: unknown }): number {
  return n.createdAtMs || toMillis(n.createdAt);
}

function isPermissionDenied(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code || '';
  return code === 'permission-denied' || code === 'firestore/permission-denied';
}

function toCatalogItem(novel: Novel): CatalogNovel {
  const desc = novel.description || '';
  const descTrimmed = desc.length > 300 ? `${desc.slice(0, 297)}...` : desc;
  const descEn = novel.descriptionEn || '';
  const descEnTrimmed = descEn.length > 300 ? `${descEn.slice(0, 297)}...` : descEn;

  return stripUndefined({
    id: novel.id,
    title: novel.title,
    titleEn: novel.titleEn,
    author: novel.author,
    authorEn: novel.authorEn,
    genre: novel.genre,
    genreEn: novel.genreEn,
    genres: novel.genres,
    status: novel.status,
    description: descTrimmed,
    descriptionEn: descEnTrimmed,
    coverUrl: novel.coverUrl,
    color: novel.color,
    accent: novel.accent,
    novelPrice: novel.novelPrice,
    bookPrice: novel.bookPrice ?? null,
    rating: (novel.visitorRatingCount && novel.visitorRatingCount > 0)
      ? (novel.visitorRatingAverage ? novel.visitorRatingAverage.toFixed(1) : undefined)
      : undefined,
    visitorRatingAverage: (novel.visitorRatingCount && novel.visitorRatingCount > 0)
      ? novel.visitorRatingAverage
      : undefined,
    visitorRatingCount: novel.visitorRatingCount || 0,
    ratingDistribution: novel.ratingDistribution,
    editorialRating: novel.editorialRating,
    editorialReview: novel.editorialReview,
    customRating: novel.customRating,
    adminRatingDistribution: novel.adminRatingDistribution,
    adminRatingCount: novel.adminRatingCount,
    adminRatingAverage: novel.adminRatingAverage,
    adminRatingPoints: novel.adminRatingPoints,
    adminRatingEnabled: novel.adminRatingEnabled,
    ratingDisplayMode: novel.ratingDisplayMode,
    ratingsEnabled: novel.ratingsEnabled,
    featured: novel.featured,
    freeChapters: novel.freeChapters,
    createdAtMs: novelCreatedMs(novel),
  }) as CatalogNovel;
}

function sortNewestFirst<T extends { createdAtMs?: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

const CATALOG_DOC = ['catalog', 'home'] as const;
const NON_EDITABLE_NOVEL_FIELDS = ['id', 'createdAt', 'updatedAt', 'createdAtMs', 'chaptersSummary', 'chaptersCount'];

function sortChaptersByNumber<T extends { number: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => (a.number || 0) - (b.number || 0));
}

export const novelService = {
  /**
   * Reads the single consolidated public catalog document: catalog/home.
   * Cached in localStorage / Memory with TTL (10 minutes).
   * This is the ONLY document read by public visitors on Home, Browse, and Store pages.
   *
   * There is NO fake/demo fallback: if the catalog does not exist the list is empty.
   * Real read errors are thrown (and therefore NOT cached) so the UI can show an error + retry.
   */
  async getCatalog(): Promise<CatalogNovel[]> {
    return clientCache.getOrFetch('catalog_home', async () => {
      const snap = await getDoc(doc(db, ...CATALOG_DOC));
      if (!snap.exists()) return [];
      const data = snap.data() as CatalogDoc;
      return Array.isArray(data.novels) ? data.novels : [];
    });
  },

  /**
   * Returns novels for Browse, Home, and Store pages.
   * If publishedOnly is true (standard public reader), reads ONLY the single catalog/home document.
   * Admin callers (no publishedOnly) read the real novels collection, drafts included.
   */
  async getNovels(options?: { publishedOnly?: boolean; genre?: string; status?: string }): Promise<Novel[]> {
    if (options?.publishedOnly) {
      let filtered = await this.getCatalog();
      if (options?.genre && options.genre !== 'الكل') {
        filtered = filtered.filter(n => novelHasGenre(n, options.genre as string));
      }
      if (options?.status && options.status !== 'الكل') {
        filtered = filtered.filter(n => n.status === options.status);
      }
      // Cast to Novel shape for UI consumers
      return filtered.map(c => ({
        ...c,
        freeChapters: c.freeChapters ?? 2,
        published: true,
      } as Novel));
    }

    // Admin view: ALL novels. No orderBy on purpose: Firestore silently drops documents
    // that lack the ordered field, which used to hide some novels from the admin list.
    const snap = await getDocs(collection(db, 'novels'));
    const list: Novel[] = [];
    snap.forEach(docSnap => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Novel, 'id'>) });
    });
    return list
      .filter(n => {
        if (options?.genre && options.genre !== 'الكل' && !novelHasGenre(n, options.genre)) return false;
        if (options?.status && options.status !== 'الكل' && n.status !== options.status) return false;
        return true;
      })
      .sort((a, b) => novelCreatedMs(b) - novelCreatedMs(a));
  },

  /**
   * Fetches a single novel doc. Cached publicly with 10-minute TTL.
   * Contains chaptersSummary for published chapters.
   * Returns null when the novel does not exist or is a draft (rules deny reading drafts).
   */
  async getNovelById(id: string): Promise<Novel | null> {
    return clientCache.getOrFetch(`novel_${id}`, async () => {
      try {
        const snap = await getDoc(doc(db, 'novels', id));
        if (snap.exists()) {
          return { id: snap.id, ...(snap.data() as Omit<Novel, 'id'>) } as Novel;
        }
        return null;
      } catch (err) {
        if (isPermissionDenied(err)) return null; // unpublished draft for a non-admin
        throw err;
      }
    });
  },

  /**
   * Resolves chapters for a novel.
   * If publishedOnly is true, uses novel.chaptersSummary (0 extra collection reads).
   * If the summary is missing it self-heals by reading the published chapters directly.
   * Admin caller with publishedOnly=false reads the whole subcollection (drafts included).
   */
  async getChapters(novelId: string, publishedOnly = false): Promise<ChapterMeta[]> {
    if (publishedOnly) {
      const novel = await this.getNovelById(novelId);
      if (!novel) return [];
      if (novel.chaptersSummary && novel.chaptersSummary.length > 0) {
        return sortChaptersByNumber(novel.chaptersSummary).map(s => ({
          id: s.id,
          novelId,
          number: s.number,
          title: s.title,
          titleEn: s.titleEn,
          isFree: s.isFree,
          published: true,
        }));
      }
      // The key starts with `novel_<id>` so saving a chapter/novel invalidates it too.
      return clientCache.getOrFetch(`novel_${novelId}_published_chapters`, async () => {
        const snap = await getDocs(
          query(collection(db, 'novels', novelId, 'chapters'), where('published', '==', true))
        );
        const list: ChapterMeta[] = [];
        snap.forEach(d => list.push({ id: d.id, ...(d.data() as Omit<ChapterMeta, 'id'>) }));
        return sortChaptersByNumber(list);
      });
    }

    const snap = await getDocs(collection(db, 'novels', novelId, 'chapters'));
    const list: ChapterMeta[] = [];
    snap.forEach(d => list.push({ id: d.id, ...(d.data() as Omit<ChapterMeta, 'id'>) }));
    return sortChaptersByNumber(list);
  },

  /**
   * Fetches chapter content. Cached in memory ONLY (never stored in localStorage).
   * Returns null when the chapter does not exist or the reader is not entitled to it.
   */
  async getChapterContent(chapterId: string): Promise<ChapterContent | null> {
    return clientCache.getOrFetch(
      `chapter_content_${chapterId}`,
      async () => {
        try {
          const snap = await getDoc(doc(db, 'chapterContents', chapterId));
          if (snap.exists()) {
            return { id: snap.id, ...(snap.data() as Omit<ChapterContent, 'id'>) };
          }
          return null;
        } catch (err) {
          if (isPermissionDenied(err)) return null;
          throw err;
        }
      },
      { memoryOnly: true }
    );
  },

  /**
   * Admin: Saves or updates a novel.
   * The novel document AND catalog/home are written in ONE transaction, so they can never
   * drift apart, and any failure is thrown to the caller (it is never swallowed).
   */
  async saveNovel(novelData: Partial<Novel>, novelId?: string): Promise<string> {
    const id = novelId || doc(collection(db, 'novels')).id;
    const novelRef = doc(db, 'novels', id);
    const catRef = doc(db, ...CATALOG_DOC);

    // Never write back derived/stale fields coming from the edit form.
    const editable: Record<string, unknown> = { ...novelData };
    for (const key of NON_EDITABLE_NOVEL_FIELDS) delete editable[key];
    // Several genres per novel: store them all, and keep genre/genreEn = the first one for older code.
    if ('genres' in editable) Object.assign(editable, genreFieldsForSave(editable.genres));

    await runTransaction(db, async tx => {
      const novelSnap = await tx.get(novelRef);
      const catSnap = await tx.get(catRef);

      const existing = novelSnap.exists()
        ? ({ id, ...(novelSnap.data() as Omit<Novel, 'id'>) } as Novel)
        : null;
      const nowMs = Date.now();

      const payload: Record<string, unknown> = { ...editable, updatedAt: serverTimestamp() };
      if (!existing) {
        payload.createdAt = serverTimestamp();
        payload.createdAtMs = nowMs;
        payload.chaptersCount = 0;
        payload.chaptersSummary = [];
      }
      tx.set(novelRef, stripUndefined(payload), { merge: true });

      const merged = {
        ...(existing ?? { chaptersCount: 0, chaptersSummary: [] }),
        ...editable,
        id,
        createdAtMs: existing ? novelCreatedMs(existing) || nowMs : nowMs,
      } as unknown as Novel;

      let items: CatalogNovel[] = catSnap.exists() ? (catSnap.data() as CatalogDoc).novels || [] : [];
      items = items.filter(n => n.id !== id);
      if (merged.published) items.push(toCatalogItem(merged));

      tx.set(catRef, { novels: stripUndefined(sortNewestFirst(items)), updatedAt: serverTimestamp() });
    });

    clientCache.invalidate(`novel_${id}`);
    clientCache.invalidate('catalog_home');
    return id;
  },

  /**
   * Admin: Deletes a novel together with ALL its chapters + chapter contents,
   * and removes it from catalog/home. The novel document is removed last.
   */
  async deleteNovel(novelId: string): Promise<void> {
    const chaptersSnap = await getDocs(collection(db, 'novels', novelId, 'chapters'));
    const contentsSnap = await getDocs(query(collection(db, 'chapterContents'), where('novelId', '==', novelId)));

    const chapterIds = new Set<string>();
    const refsToDelete: DocumentReference[] = [];
    chaptersSnap.forEach(d => {
      chapterIds.add(d.id);
      refsToDelete.push(d.ref);
    });
    contentsSnap.forEach(d => {
      chapterIds.add(d.id);
    });
    chapterIds.forEach(cid => refsToDelete.push(doc(db, 'chapterContents', cid)));

    for (let i = 0; i < refsToDelete.length; i += 400) {
      const batch = writeBatch(db);
      refsToDelete.slice(i, i + 400).forEach(r => batch.delete(r));
      await batch.commit();
    }

    const catRef = doc(db, ...CATALOG_DOC);
    await runTransaction(db, async tx => {
      const catSnap = await tx.get(catRef);
      if (catSnap.exists()) {
        const items = ((catSnap.data() as CatalogDoc).novels || []).filter(n => n.id !== novelId);
        tx.set(catRef, { novels: stripUndefined(items), updatedAt: serverTimestamp() });
      }
      tx.delete(doc(db, 'novels', novelId));
    });

    clientCache.invalidate(`novel_${novelId}`);
    clientCache.invalidate('catalog_home');
    chapterIds.forEach(cid => clientCache.invalidate(`chapter_content_${cid}`));
  },

  /**
   * Admin: Saves a chapter.
   * Denormalizes { novelId, isFree, body } on chapterContents.
   * Re-syncs chaptersSummary on the novel + catalog/home unless options.skipSync is set
   * (bulk import syncs once at the end instead of once per chapter).
   */
  async saveChapter(
    novelId: string,
    chapterData: Partial<ChapterMeta>,
    chapterId?: string,
    bodyText?: string,
    options?: { skipSync?: boolean }
  ): Promise<string> {
    const isNew = !chapterId;
    const id = chapterId || doc(collection(db, 'novels', novelId, 'chapters')).id;

    const meta: Record<string, unknown> = { ...chapterData };
    delete meta.id;
    delete meta.createdAt;

    const batch = writeBatch(db);
    const chapterRef = doc(db, 'novels', novelId, 'chapters', id);
    batch.set(
      chapterRef,
      stripUndefined({
        ...meta,
        novelId,
        updatedAt: serverTimestamp(),
        // createdAt is written ONLY when the chapter is created (it used to be overwritten on every edit)
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      }),
      { merge: true }
    );

    // Denormalize on chapterContents: { novelId, isFree, body }
    if (bodyText !== undefined || chapterData.isFree !== undefined) {
      const contentPayload: Record<string, unknown> = { novelId };
      if (chapterData.isFree !== undefined) contentPayload.isFree = Boolean(chapterData.isFree);
      if (bodyText !== undefined) contentPayload.body = bodyText;
      batch.set(doc(db, 'chapterContents', id), contentPayload, { merge: true });
    }

    await batch.commit();

    clientCache.invalidate(`novel_${novelId}`);
    clientCache.invalidate(`chapter_content_${id}`);
    clientCache.invalidate('catalog_home');

    if (!options?.skipSync) {
      try {
        await this.syncNovelChaptersSummary(novelId);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        throw new Error(`تم حفظ الفصل لكن فشل تحديث قائمة الفصول (اضغط "إعادة بناء الفهرس"): ${reason}`);
      }
    }
    return id;
  },

  /**
   * Admin: Deletes a chapter, updating summary and catalog.
   */
  async deleteChapter(novelId: string, chapterId: string): Promise<void> {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'novels', novelId, 'chapters', chapterId));
    batch.delete(doc(db, 'chapterContents', chapterId));
    await batch.commit();

    clientCache.invalidate(`novel_${novelId}`);
    clientCache.invalidate(`chapter_content_${chapterId}`);
    clientCache.invalidate('catalog_home');

    await this.syncNovelChaptersSummary(novelId);
  },

  /**
   * Syncs the published chapter summary on a single novel doc and the chaptersCount in catalog/home.
   * Throws on failure (callers decide how to report it).
   */
  async syncNovelChaptersSummary(novelId: string): Promise<ChapterSummaryItem[]> {
    const snap = await getDocs(collection(db, 'novels', novelId, 'chapters'));
    const summaries: ChapterSummaryItem[] = [];
    snap.forEach(d => {
      const c = d.data();
      if (c.published) {
        summaries.push(
          stripUndefined({
            id: d.id,
            number: Number(c.number) || 0,
            title: c.title || '',
            titleEn: c.titleEn || undefined,
            isFree: Boolean(c.isFree),
          }) as ChapterSummaryItem
        );
      }
    });
    const sorted = sortChaptersByNumber(summaries);

    const novelRef = doc(db, 'novels', novelId);
    const catRef = doc(db, ...CATALOG_DOC);
    await runTransaction(db, async tx => {
      const novelSnap = await tx.get(novelRef);
      const catSnap = await tx.get(catRef);
      if (!novelSnap.exists()) return;

      tx.update(novelRef, {
        chaptersSummary: sorted,
        chaptersCount: sorted.length,
        updatedAt: serverTimestamp(),
      });

      if (catSnap.exists()) {
        const items = (catSnap.data() as CatalogDoc).novels || [];
        if (items.some(n => n.id === novelId)) {
          const updated = items.map(n => (n.id === novelId ? { ...n, chaptersCount: sorted.length } : n));
          tx.set(catRef, { novels: stripUndefined(updated), updatedAt: serverTimestamp() });
        }
      }
    });

    clientCache.invalidate(`novel_${novelId}`);
    clientCache.invalidate('catalog_home');
    return sorted;
  },

  /**
   * Idempotent full rebuild from the REAL novels collection:
   * 1. Rebuilds catalog/home (this also removes any ghost/demo entries that are not real novels)
   * 2. Rebuilds every novel's chaptersSummary
   * 3. Backfills { isFree, novelId } on every chapterContents document
   * Keeps write operations per batch under 400 (Firestore limit is 500).
   */
  async rebuildCatalogAndSummaries(): Promise<{ success: boolean; message: string; rebuiltNovelsCount: number }> {
    try {
      const novelsSnap = await getDocs(collection(db, 'novels'));
      const catalogItems: CatalogNovel[] = [];
      let currentBatch = writeBatch(db);
      let opsInBatch = 0;

      const commitBatchIfNeeded = async (force = false) => {
        if (opsInBatch > 0 && (force || opsInBatch >= 380)) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          opsInBatch = 0;
        }
      };

      for (const novelDoc of novelsSnap.docs) {
        const novelData = novelDoc.data() as Omit<Novel, 'id'>;
        const novelId = novelDoc.id;

        const chaptersSnap = await getDocs(collection(db, 'novels', novelId, 'chapters'));
        const publishedSummaries: ChapterSummaryItem[] = [];

        for (const chDoc of chaptersSnap.docs) {
          const chData = chDoc.data();
          const isFree = Boolean(chData.isFree);

          if (chData.published) {
            publishedSummaries.push(
              stripUndefined({
                id: chDoc.id,
                number: Number(chData.number) || 0,
                title: chData.title || '',
                titleEn: chData.titleEn || undefined,
                isFree,
              }) as ChapterSummaryItem
            );
          }

          // Backfill isFree and novelId on chapterContents document
          currentBatch.set(doc(db, 'chapterContents', chDoc.id), { novelId, isFree }, { merge: true });
          opsInBatch++;
          await commitBatchIfNeeded();
        }

        const sorted = sortChaptersByNumber(publishedSummaries);
        currentBatch.update(doc(db, 'novels', novelId), {
          chaptersSummary: sorted,
          chaptersCount: sorted.length,
          updatedAt: serverTimestamp(),
        });
        opsInBatch++;
        await commitBatchIfNeeded();

        if (novelData.published) {
          catalogItems.push(
            toCatalogItem({
              id: novelId,
              ...novelData,
              chaptersSummary: sorted,
              chaptersCount: sorted.length,
            })
          );
        }
      }

      currentBatch.set(doc(db, ...CATALOG_DOC), {
        novels: stripUndefined(sortNewestFirst(catalogItems)),
        updatedAt: serverTimestamp(),
      });
      opsInBatch++;
      await commitBatchIfNeeded(true);

      clientCache.clear();

      return {
        success: true,
        message: 'تمت إعادة بناء الفهرس وملخصات الفصول بنجاح!',
        rebuiltNovelsCount: catalogItems.length,
      };
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('rebuildCatalogAndSummaries error:', err);
      }
      const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
      return {
        success: false,
        message: `فشلت إعادة البناء: ${msg}`,
        rebuiltNovelsCount: 0,
      };
    }
  },

  /**
   * Admin: Updates novel rating settings.
   * Modifies only administrative controls and display options.
   * Genuine visitor ratings and reviews are completely preserved.
   */
  async updateNovelRatingSettings(
    novelId: string,
    params: {
      ratingDisplayMode: RatingDisplayMode;
      ratingsEnabled: boolean;
      adminRatingDistribution?: AdminRatingDistribution;
      adminRatingEnabled?: boolean;
      editorialRating?: number | null;
      editorialReview?: string;
      customRating?: number | null;
    },
    adminInfo?: { adminUid: string; adminEmail: string }
  ): Promise<{ success: boolean; message: string }> {
    const novelRef = doc(db, 'novels', novelId);
    const catRef = doc(db, ...CATALOG_DOC);

    const adminStats = calculateAdminRatingStats(params.adminRatingDistribution);
    const cleanEditorial = validRating(params.editorialRating);
    const cleanCustom = validRating(params.customRating);

    const updatePayload: Record<string, unknown> = {
      ratingDisplayMode: params.ratingDisplayMode,
      ratingsEnabled: params.ratingsEnabled !== false,
      adminRatingDistribution: adminStats.distribution,
      adminRatingCount: adminStats.count,
      adminRatingPoints: adminStats.points,
      adminRatingAverage: adminStats.average,
      adminRatingEnabled: params.adminRatingEnabled !== false,
      editorialRating: cleanEditorial,
      editorialReview: (params.editorialReview || '').trim().slice(0, 1000),
      customRating: cleanCustom,
      updatedAt: serverTimestamp(),
    };

    await runTransaction(db, async tx => {
      const novelSnap = await tx.get(novelRef);
      if (!novelSnap.exists()) {
        throw new Error('الرواية غير موجودة.');
      }
      const existing = { id: novelId, ...(novelSnap.data() as Omit<Novel, 'id'>) } as Novel;

      // Firestore requires ALL reads before ANY writes in a transaction.
      const catSnap = await tx.get(catRef);

      tx.update(novelRef, stripUndefined(updatePayload));

      if (catSnap.exists()) {
        const catData = catSnap.data() as CatalogDoc;
        const mergedNovel: Novel = {
          ...existing,
          ...updatePayload,
          id: novelId,
        } as Novel;

        const items = (catData.novels || []).filter(n => n.id !== novelId);
        if (mergedNovel.published) {
          items.push(toCatalogItem(mergedNovel));
        }
        tx.update(catRef, { novels: stripUndefined(sortNewestFirst(items)), updatedAt: serverTimestamp() });
      }
    });

    clientCache.invalidate(`novel_${novelId}`);
    clientCache.invalidate('catalog_home');

    // Audit Log
    if (adminInfo) {
      try {
        const auditId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'auditLogs', auditId), {
          id: auditId,
          adminUid: adminInfo.adminUid,
          adminEmail: adminInfo.adminEmail,
          action: 'update_rating_settings',
          targetType: 'novel',
          targetId: novelId,
          details: {
            ratingDisplayMode: params.ratingDisplayMode,
            adminRatingCount: adminStats.count,
            adminRatingAverage: adminStats.average,
            adminRatingEnabled: params.adminRatingEnabled !== false,
          },
          timestamp: serverTimestamp(),
        });
      } catch {
        // non-blocking audit log
      }
    }

    return { success: true, message: 'تم حفظ وتحديث إعدادات التقييم بنجاح!' };
  },

  /**
   * Admin: Resets administrative statistics back to 0 without deleting ANY reader ratings.
   */
  async resetAdminRatingSettings(
    novelId: string,
    adminInfo?: { adminUid: string; adminEmail: string }
  ): Promise<{ success: boolean; message: string }> {
    return this.updateNovelRatingSettings(
      novelId,
      {
        ratingDisplayMode: 'visitor',
        ratingsEnabled: true,
        adminRatingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        adminRatingEnabled: false,
        editorialRating: null,
        editorialReview: '',
        customRating: null,
      },
      adminInfo
    );
  },

  /**
   * Synchronizes a single novel document's current values into catalog/home.
   */
  async syncNovelToCatalog(novelId: string): Promise<void> {
    const novelSnap = await getDoc(doc(db, 'novels', novelId));
    if (!novelSnap.exists()) return;
    const novel = { id: novelId, ...(novelSnap.data() as Omit<Novel, 'id'>) } as Novel;

    const catRef = doc(db, ...CATALOG_DOC);
    await runTransaction(db, async tx => {
      const catSnap = await tx.get(catRef);
      if (catSnap.exists()) {
        const catData = catSnap.data() as CatalogDoc;
        const items = (catData.novels || []).filter(n => n.id !== novelId);
        if (novel.published) {
          items.push(toCatalogItem(novel));
        }
        tx.update(catRef, { novels: stripUndefined(sortNewestFirst(items)), updatedAt: serverTimestamp() });
      }
    });

    clientCache.invalidate(`novel_${novelId}`);
    clientCache.invalidate('catalog_home');
  },
};
