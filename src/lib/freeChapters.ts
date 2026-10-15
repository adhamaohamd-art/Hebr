/**
 * Single definition of "free chapter" shared by the UI, the admin tools and (mirrored by hand)
 * firestore.rules: a chapter is free when it is explicitly flagged isFree, OR its number is
 * within the novel's freeChapters setting.
 */
export function isWithinFreeChapters(chapterNumber: number, freeChapters: number | null | undefined): boolean {
  const limit = Number(freeChapters);
  return Number.isFinite(limit) && limit > 0 && chapterNumber <= limit;
}
