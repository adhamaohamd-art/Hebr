/**
 * Single definition of "free chapter" shared by the UI, the admin tools and (mirrored by hand)
 * firestore.rules: a chapter is free when it is explicitly flagged isFree, OR its number is
 * within the novel's freeChapters setting, OR the whole novel is flagged isFreeNovel.
 */
export function isWithinFreeChapters(chapterNumber: number, freeChapters: number | null | undefined): boolean {
  const limit = Number(freeChapters);
  return Number.isFinite(limit) && limit > 0 && chapterNumber <= limit;
}

/** True when the admin marked the whole novel as free (every chapter readable without paying). */
export function isFreeNovel(novel: { isFreeNovel?: boolean | null } | null | undefined): boolean {
  return novel?.isFreeNovel === true;
}

/**
 * Is this chapter readable for free? Used by the reader, the chapter list and the cards.
 * `chapterIsFree` is the per-chapter flag stored on the chapter itself (may be undefined).
 */
export function isChapterFree(
  chapterNumber: number,
  novel: { freeChapters?: number | null; isFreeNovel?: boolean | null } | null | undefined,
  chapterIsFree?: boolean | null
): boolean {
  if (isFreeNovel(novel)) return true;
  if (chapterIsFree === true) return true;
  return isWithinFreeChapters(chapterNumber, novel?.freeChapters);
}
