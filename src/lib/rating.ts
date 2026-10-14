import type { Novel, CatalogNovel, AdminRatingDistribution, RatingDistribution, NovelRatingSummary } from '../types';

/**
 * Validates that a star rating count is a non-negative integer within reasonable bounds.
 * Rejects negative, NaN, non-finite, and absurdly large values.
 */
export function validateStarCount(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  if (!Number.isFinite(num) || isNaN(num) || num < 0) {
    throw new Error('يجب أن يكون عدد التقييمات رقماً صحيحاً موجباً أو صفراً.');
  }
  if (num > 1_000_000) {
    throw new Error('العدد المدخل كبير جداً (الحد الأقصى هو 1,000,000).');
  }
  return Math.floor(num);
}

/**
 * Safely parses a star count without throwing (defaults to 0 on invalid).
 */
export function parseStarCount(value: unknown): number {
  try {
    return validateStarCount(value);
  } catch {
    return 0;
  }
}

/**
 * Validates a rating score (1.0 to 5.0).
 */
export function validRating(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || isNaN(value) || value < 1 || value > 5) {
    return null;
  }
  return Number(value.toFixed(2));
}

/**
 * Normalizes an administrative rating distribution object and calculates its points, count, and average.
 */
export function calculateAdminRatingStats(dist?: Partial<AdminRatingDistribution> | null): {
  distribution: AdminRatingDistribution;
  count: number;
  points: number;
  average: number;
} {
  const c1 = parseStarCount(dist?.[1]);
  const c2 = parseStarCount(dist?.[2]);
  const c3 = parseStarCount(dist?.[3]);
  const c4 = parseStarCount(dist?.[4]);
  const c5 = parseStarCount(dist?.[5]);

  const distribution: AdminRatingDistribution = { 1: c1, 2: c2, 3: c3, 4: c4, 5: c5 };
  const count = c1 + c2 + c3 + c4 + c5;
  const points = 1 * c1 + 2 * c2 + 3 * c3 + 4 * c4 + 5 * c5;
  const average = count > 0 ? Number((points / count).toFixed(2)) : 0;

  return { distribution, count, points, average };
}

/**
 * Calculates genuine reader points from either a distribution or count & average.
 */
export function calculateVisitorPoints(
  count: number,
  average?: number | null,
  distribution?: Partial<RatingDistribution> | null
): number {
  if (count <= 0) return 0;
  if (distribution) {
    const c1 = parseStarCount(distribution[1]);
    const c2 = parseStarCount(distribution[2]);
    const c3 = parseStarCount(distribution[3]);
    const c4 = parseStarCount(distribution[4]);
    const c5 = parseStarCount(distribution[5]);
    const distCount = c1 + c2 + c3 + c4 + c5;
    if (distCount > 0) {
      return 1 * c1 + 2 * c2 + 3 * c3 + 4 * c4 + 5 * c5;
    }
  }
  const avg = typeof average === 'number' && Number.isFinite(average) ? average : 0;
  return Number((avg * count).toFixed(2));
}

/**
 * Calculates combined rating statistics according to the required weighted formula:
 * Combined average = (Admin points + Reader points) / (Admin count + Reader count)
 * Combined count = Admin count + Reader count
 */
export function calculateCombinedRatingStats(
  visitor: {
    count: number;
    average?: number | null;
    distribution?: Partial<RatingDistribution> | null;
    points?: number;
  },
  admin: {
    count: number;
    points?: number;
    average?: number;
    distribution?: Partial<AdminRatingDistribution> | null;
    enabled?: boolean;
  }
): {
  combinedCount: number;
  combinedPoints: number;
  combinedAverage: number | null;
  visitorCount: number;
  visitorPoints: number;
  visitorAverage: number | null;
  adminCount: number;
  adminPoints: number;
  adminAverage: number | null;
} {
  const visitorCount = Math.max(0, Math.floor(Number(visitor.count) || 0));
  const visitorPoints = visitor.points !== undefined
    ? Math.max(0, Number(visitor.points) || 0)
    : calculateVisitorPoints(visitorCount, visitor.average, visitor.distribution);
  const visitorAverage = visitorCount > 0 ? Number((visitorPoints / visitorCount).toFixed(2)) : null;

  const adminEnabled = admin.enabled !== false;
  let adminCount = 0;
  let adminPoints = 0;
  let adminAverage: number | null = null;

  if (adminEnabled) {
    if (admin.distribution) {
      const stats = calculateAdminRatingStats(admin.distribution);
      adminCount = stats.count;
      adminPoints = stats.points;
      adminAverage = stats.count > 0 ? stats.average : null;
    } else {
      adminCount = Math.max(0, Math.floor(Number(admin.count) || 0));
      adminPoints = admin.points !== undefined
        ? Math.max(0, Number(admin.points) || 0)
        : Number(((admin.average || 0) * adminCount).toFixed(2));
      adminAverage = adminCount > 0 ? (admin.average ? Number(admin.average.toFixed(2)) : Number((adminPoints / adminCount).toFixed(2))) : null;
    }
  }

  const combinedCount = visitorCount + adminCount;
  const combinedPoints = Number((visitorPoints + adminPoints).toFixed(2));
  const combinedAverage = combinedCount > 0 ? Number((combinedPoints / combinedCount).toFixed(2)) : null;

  return {
    combinedCount,
    combinedPoints,
    combinedAverage,
    visitorCount,
    visitorPoints,
    visitorAverage,
    adminCount,
    adminPoints,
    adminAverage,
  };
}

/**
 * Returns the authoritative rating summary for any novel.
 * Ratings come ONLY from genuine reader reviews. Legacy editorial / custom /
 * combined / admin-managed values that may still exist in old documents are
 * ignored on purpose, and 0 reader ratings never display a fabricated average.
 */
export function getNovelRatingSummary(novel: Novel | CatalogNovel): NovelRatingSummary {
  const visitorCount = Math.max(0, Math.floor(Number(novel.visitorRatingCount) || 0));
  const vDist = novel.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const visitorDistribution: RatingDistribution = {
    1: parseStarCount(vDist[1]),
    2: parseStarCount(vDist[2]),
    3: parseStarCount(vDist[3]),
    4: parseStarCount(vDist[4]),
    5: parseStarCount(vDist[5]),
  };
  const visitorPoints = calculateVisitorPoints(visitorCount, novel.visitorRatingAverage, visitorDistribution);
  const visitorAverage = visitorCount > 0 ? Number((visitorPoints / visitorCount).toFixed(2)) : null;

  const average = visitorCount > 0 ? visitorAverage : null;
  const hasRatings = average !== null && visitorCount > 0;
  const displayAverage = average !== null ? average.toFixed(1) : '—';

  return {
    mode: 'visitor',
    average,
    displayAverage,
    totalCount: visitorCount,
    hasRatings,
    visitorCount,
    visitorAverage,
    visitorDistribution,
    adminCount: 0,
    adminAverage: null,
    adminPoints: 0,
    adminDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    adminEnabled: false,
    editorialRating: null,
    editorialReview: undefined,
    customRating: null,
    isCombined: false,
    isEditorial: false,
    isCustom: false,
    isVisitorOnly: true,
    ratingsEnabled: novel.ratingsEnabled !== false,
  };
}

/**
 * Public display score. Always returns null if no valid rating exists.
 * Prevents showing a fabricated rating (like 4.9) when there are zero reader ratings.
 */
export function getDisplayedRating(novel: Novel | CatalogNovel): number | null {
  return getNovelRatingSummary(novel).average;
}

/**
 * Returns localized label and badge representation for the novel's rating.
 */
export function getRatingDisplayDetails(novel: Novel | CatalogNovel, language: 'ar' | 'en' = 'ar'): {
  badge: string;
  badgeType: 'visitor' | 'combined' | 'editorial' | 'custom' | 'empty';
  tagLabel: string;
  subtext: string;
} {
  const summary = getNovelRatingSummary(novel);

  if (!summary.hasRatings) {
    return {
      badge: '',
      badgeType: 'empty',
      tagLabel: '',
      subtext: language === 'ar' ? 'لا توجد تقييمات بعد' : 'No ratings yet',
    };
  }

  return {
    badge: `★ ${summary.displayAverage} (${summary.visitorCount})`,
    badgeType: 'visitor',
    tagLabel: '',
    subtext: language === 'ar'
      ? `بناءً على ${summary.visitorCount} تقييماً من القراء`
      : `Based on ${summary.visitorCount} reader ratings`,
  };
}
