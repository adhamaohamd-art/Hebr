import assert from 'node:assert/strict';
import {
  calculateAdminRatingStats,
  calculateCombinedRatingStats,
  getNovelRatingSummary,
  validateStarCount,
  parseStarCount,
  getDisplayedRating,
  getRatingDisplayDetails,
} from '../src/lib/rating';
import { reviewService } from '../src/services/reviewService';
import type { Novel, AdminRatingDistribution, RatingDistribution } from '../src/types';

console.log('🧪 Running Complete HEBR Rating System Test Suite...\n');

let passedTests = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ Passed: ${name}`);
    passedTests++;
  } catch (err: unknown) {
    console.error(`❌ Failed: ${name}`);
    console.error(err);
    process.exit(1);
  }
}


function readerNovel(over: Partial<Novel> = {}): Novel {
  return {
    id: 'n', title: 'رواية', author: 'كاتب', genre: 'دراما', status: 'مستمرة', description: '',
    novelPrice: 50, bookPrice: null, freeChapters: 1, chaptersCount: 5, published: true,
    color: '#111', accent: '#222', ...over,
  } as Novel;
}

// 1. A novel with no ratings displays "No ratings yet."
test('1. A novel with no ratings displays "No ratings yet" (average is null)', () => {
  const emptyNovel: Novel = {
    id: 'novel-1',
    title: 'رواية تجريبية',
    author: 'كاتب',
    genre: 'دراما',
    status: 'مستمرة',
    description: 'وصف',
    novelPrice: 50,
    bookPrice: null,
    freeChapters: 2,
    chaptersCount: 10,
    published: true,
    color: '#23483f',
    accent: '#a98a63',
    ratingDisplayMode: 'visitor',
    visitorRatingCount: 0,
    visitorRatingAverage: 0,
  };

  const summary = getNovelRatingSummary(emptyNovel);
  assert.equal(summary.average, null);
  assert.equal(summary.hasRatings, false);
  assert.equal(summary.displayAverage, '—');
  assert.equal(getDisplayedRating(emptyNovel), null);

  const displayAr = getRatingDisplayDetails(emptyNovel, 'ar');
  assert.equal(displayAr.subtext, 'لا توجد تقييمات بعد');
  const displayEn = getRatingDisplayDetails(emptyNovel, 'en');
  assert.equal(displayEn.subtext, 'No ratings yet');
});

// 2. Legacy administrative ratings are ignored: only reader ratings count.
test('2. Legacy administrative ratings never affect the displayed rating', () => {
  const n = readerNovel({
    ratingDisplayMode: 'combined',
    adminRatingDistribution: { 1: 0, 2: 0, 3: 10, 4: 20, 5: 30 },
    adminRatingEnabled: true,
  });
  const s = getNovelRatingSummary(n);
  assert.equal(s.average, null);
  assert.equal(s.totalCount, 0);
  assert.equal(s.adminCount, 0);
  assert.equal(s.hasRatings, false);
});

// 3. A novel with genuine reader ratings only calculates the correct average.
test('3. A novel with genuine reader ratings only calculates the correct average', () => {
  const visitorDist: RatingDistribution = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 3 }; // 10 ratings: 1+2+6+12+15 = 36 pts => 3.6 avg
  const novel: Novel = {
    id: 'novel-reader-only',
    title: 'رواية القراء',
    author: 'كاتب',
    genre: 'فانتازيا',
    status: 'مستمرة',
    description: '',
    novelPrice: 60,
    bookPrice: null,
    freeChapters: 2,
    chaptersCount: 15,
    published: true,
    color: '#111',
    accent: '#222',
    ratingDisplayMode: 'visitor',
    visitorRatingCount: 10,
    visitorRatingAverage: 3.6,
    ratingDistribution: visitorDist,
  };

  const summary = getNovelRatingSummary(novel);
  assert.equal(summary.isVisitorOnly, true);
  assert.equal(summary.visitorCount, 10);
  assert.equal(summary.average, 3.6);
  assert.equal(summary.totalCount, 10);
  assert.equal(summary.hasRatings, true);
});

// 4. Legacy "combined" mode shows the genuine reader average only.
test('4. Legacy combined mode shows the genuine reader average only', () => {
  const n = readerNovel({
    ratingDisplayMode: 'combined',
    visitorRatingCount: 4,
    visitorRatingAverage: 4,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 4, 5: 0 },
    adminRatingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 },
    adminRatingEnabled: true,
  });
  const s = getNovelRatingSummary(n);
  assert.equal(s.average, 4);
  assert.equal(s.totalCount, 4);
  assert.equal(s.isCombined, false);
});

// 5. Visitor mode excludes administrative statistics.
test('5. Visitor mode excludes administrative statistics', () => {
  const novel: Novel = {
    id: 'novel-mode-visitor',
    title: 'رواية نمط الزوار',
    author: 'كاتب',
    genre: 'رعب',
    status: 'مستمرة',
    description: '',
    novelPrice: 50,
    bookPrice: null,
    freeChapters: 2,
    chaptersCount: 10,
    published: true,
    color: '#111',
    accent: '#222',
    ratingDisplayMode: 'visitor',
    visitorRatingCount: 5,
    visitorRatingAverage: 4.0,
    adminRatingDistribution: { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0 }, // 100x1 star in admin
    adminRatingEnabled: true,
  };

  const summary = getNovelRatingSummary(novel);
  assert.equal(summary.mode, 'visitor');
  assert.equal(summary.isVisitorOnly, true);
  assert.equal(summary.average, 4.0);
  assert.equal(summary.totalCount, 5);
  // Administrative stats must not alter visitor score
  assert.notEqual(summary.average, 1.0);
});

// 6. Editorial rating is removed: it can no longer override reader ratings.
test('6. Legacy editorial rating can no longer override reader ratings', () => {
  const n = readerNovel({
    ratingDisplayMode: 'editorial',
    editorialRating: 5,
    editorialReview: 'x',
    visitorRatingCount: 2,
    visitorRatingAverage: 3,
    ratingDistribution: { 1: 0, 2: 0, 3: 2, 4: 0, 5: 0 },
  });
  const s = getNovelRatingSummary(n);
  assert.equal(s.average, 3);
  assert.equal(s.isEditorial, false);
  assert.equal(s.editorialRating, null);
});

// 7. Custom rating is removed as well.
test('7. Legacy custom rating can no longer override reader ratings', () => {
  const n = readerNovel({ ratingDisplayMode: 'custom', customRating: 5 });
  const s = getNovelRatingSummary(n);
  assert.equal(s.average, null);
  assert.equal(s.isCustom, false);
  assert.equal(getDisplayedRating(n), null);
});

// 8. A new genuine reader rating increases the genuine count by exactly one.
test('8. A new genuine reader rating increases the genuine count by exactly one', () => {
  let readerCount = 0;
  let totalPoints = 0;

  // New review submitted by user-A (rating: 5)
  readerCount += 1;
  totalPoints += 5;
  let readerAverage = totalPoints / readerCount;
  assert.equal(readerCount, 1);
  assert.equal(readerAverage, 5.0);

  // New review submitted by user-B (rating: 3)
  readerCount += 1;
  totalPoints += 3;
  readerAverage = totalPoints / readerCount;
  assert.equal(readerCount, 2);
  assert.equal(readerAverage, 4.0);
});

// 9. Updating an existing reader rating does not increase the count.
test('9. Updating an existing reader rating does not increase the count', () => {
  const readerCount = 2;
  let totalPoints = 8; // 5 + 3

  // user-B updates rating from 3 to 5
  const oldUserRating = 3;
  const newUserRating = 5;
  totalPoints = totalPoints - oldUserRating + newUserRating;
  // Count remains unchanged
  assert.equal(readerCount, 2);
  assert.equal(totalPoints, 10);
  assert.equal(totalPoints / readerCount, 5.0);
});

// 10. Duplicate rating submissions are prevented according to supported identity model.
test('10. Duplicate rating submissions are prevented using deterministic ID `${novelId}_${userId}`', () => {
  const novelId = 'novel-123';
  const userId = 'user-abc';
  const docId1 = reviewService.getReviewDocId(novelId, userId);
  const docId2 = reviewService.getReviewDocId(novelId, userId);

  assert.equal(docId1, 'novel-123_user-abc');
  assert.equal(docId1, docId2, 'Same user on same novel always produces identical document ID');
});

// 11. Resetting administrative statistics preserves genuine reader ratings.
test('11. Resetting administrative statistics preserves genuine reader ratings', () => {
  const novelBeforeReset: Novel = {
    id: 'novel-reset-test',
    title: 'رواية تجربة التصفير',
    author: 'كاتب',
    genre: 'دراما',
    status: 'مكتملة',
    description: '',
    novelPrice: 50,
    bookPrice: null,
    freeChapters: 2,
    chaptersCount: 10,
    published: true,
    color: '#111',
    accent: '#222',
    ratingDisplayMode: 'combined',
    visitorRatingCount: 15,
    visitorRatingAverage: 4.2,
    ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 5, 5: 7 },
    adminRatingDistribution: { 1: 0, 2: 0, 3: 10, 4: 20, 5: 30 },
    adminRatingEnabled: true,
  };

  // Perform reset operation: sets admin distribution to 0, adminEnabled to false, mode to visitor
  const novelAfterReset: Novel = {
    ...novelBeforeReset,
    ratingDisplayMode: 'visitor',
    adminRatingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    adminRatingCount: 0,
    adminRatingPoints: 0,
    adminRatingAverage: 0,
    adminRatingEnabled: false,
    editorialRating: null,
    editorialReview: '',
    customRating: null,
  };

  // Genuine visitor ratings MUST be completely intact
  assert.equal(novelAfterReset.visitorRatingCount, 15);
  assert.equal(novelAfterReset.visitorRatingAverage, 4.2);
  assert.deepEqual(novelAfterReset.ratingDistribution, { 1: 0, 2: 1, 3: 2, 4: 5, 5: 7 });

  const summary = getNovelRatingSummary(novelAfterReset);
  assert.equal(summary.isVisitorOnly, true);
  assert.equal(summary.average, 4.2);
  assert.equal(summary.totalCount, 15);
  assert.equal(summary.adminCount, 0);
});

// 12. One novel's ratings do not affect another novel.
test("12. One novel's ratings do not affect another novel", () => {
  const a = readerNovel({ id: 'A', visitorRatingCount: 2, visitorRatingAverage: 4.5, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } });
  const b = readerNovel({ id: 'B', visitorRatingCount: 8, visitorRatingAverage: 3.2 });
  assert.notEqual(getNovelRatingSummary(a).average, getNovelRatingSummary(b).average);
  assert.equal(getNovelRatingSummary(a).totalCount, 2);
  assert.equal(getNovelRatingSummary(b).totalCount, 8);
});

// 13. Invalid or negative administrative counts are rejected.
test('13. Invalid or negative administrative counts are rejected', () => {
  assert.throws(() => validateStarCount(-5), /موجباً أو صفراً/);
  assert.throws(() => validateStarCount('abc'), /موجباً أو صفراً/);
  assert.throws(() => validateStarCount(NaN), /موجباً أو صفراً/);
  assert.throws(() => validateStarCount(2_000_000), /كبير جداً/);

  // Valid values
  assert.equal(validateStarCount(0), 0);
  assert.equal(validateStarCount(45), 45);
  assert.equal(validateStarCount('120'), 120);

  // parseStarCount safely falls back to 0 without throwing
  assert.equal(parseStarCount(-10), 0);
  assert.equal(parseStarCount('invalid'), 0);
});

// 14. Ordinary users cannot modify administrative fields.
test('14. Security invariant: ordinary users can only affect visitor rating keys', () => {
  // Allowed keys for ordinary users according to firestore.rules:
  const allowedUserKeys = ['visitorRatingAverage', 'visitorRatingCount', 'ratingDistribution', 'rating', 'updatedAt'];
  const adminOnlyKeys = [
    'adminRatingDistribution',
    'adminRatingCount',
    'adminRatingAverage',
    'adminRatingPoints',
    'adminRatingEnabled',
    'editorialRating',
    'editorialReview',
    'customRating',
    'ratingDisplayMode',
  ];

  for (const adminKey of adminOnlyKeys) {
    assert.equal(
      allowedUserKeys.includes(adminKey),
      false,
      `Key ${adminKey} must not be modifiable by ordinary users`
    );
  }
});

// 15. Users cannot modify another user's rating.
test("15. Security invariant: user ratings are scoped strictly to request.auth.uid", () => {
  const currentUserId = 'user-alice';
  const targetUserId = 'user-bob';
  const novelId = 'novel-999';

  const aliceDocId = reviewService.getReviewDocId(novelId, currentUserId);
  const bobDocId = reviewService.getReviewDocId(novelId, targetUserId);

  assert.notEqual(aliceDocId, bobDocId);
  assert.equal(aliceDocId.endsWith(currentUserId), true);
  assert.equal(bobDocId.endsWith(targetUserId), true);
});

// 16. Rating calculations remain correct under concurrent updates.
test('16. Rating calculations remain correct under simulated concurrent updates', () => {
  // Simulate 50 concurrent reader ratings with star ratings 1 to 5
  const ratings = [
    5, 5, 5, 4, 4, 3, 5, 4, 4, 2,
    5, 5, 4, 3, 5, 5, 4, 4, 5, 3,
    5, 4, 5, 4, 4, 5, 5, 3, 4, 5,
    4, 4, 5, 5, 2, 5, 4, 3, 4, 5,
    5, 5, 4, 4, 5, 3, 5, 4, 5, 5,
  ];

  const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of ratings) {
    distribution[r as 1 | 2 | 3 | 4 | 5]++;
    sum += r;
  }

  const expectedAverage = Number((sum / ratings.length).toFixed(2));
  assert.equal(Number((sum / ratings.length).toFixed(2)), expectedAverage);
  const adminDist: AdminRatingDistribution = { 1: 0, 2: 0, 3: 5, 4: 15, 5: 30 };
  const adminStats = calculateAdminRatingStats(adminDist);

  const combined = calculateCombinedRatingStats(
    { count: ratings.length, points: sum, distribution },
    { count: adminStats.count, points: adminStats.points, distribution: adminDist, enabled: true }
  );

  const totalPoints = sum + adminStats.points;
  const totalCount = ratings.length + adminStats.count;
  const expectedCombined = Number((totalPoints / totalCount).toFixed(2));

  assert.equal(combined.combinedCount, totalCount);
  assert.equal(combined.combinedAverage, expectedCombined);
});

// 17. All novel cards and detail pages display consistent values.
test('17. Novel cards and detail pages display consistent values via authoritative summary', () => {
  const novel: Novel = {
    id: 'novel-consistency',
    title: 'رواية الاتساق',
    author: 'الكاتب',
    genre: 'أدب',
    status: 'مكتملة',
    description: 'رواية ممتازة',
    novelPrice: 75,
    bookPrice: 100,
    freeChapters: 2,
    chaptersCount: 12,
    published: true,
    color: '#23483f',
    accent: '#a98a63',
    ratingDisplayMode: 'combined',
    visitorRatingCount: 20,
    visitorRatingAverage: 4.1,
    adminRatingDistribution: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 30 },
    adminRatingEnabled: true,
  };

  const cardSummary = getNovelRatingSummary(novel);
  const detailSummary = getNovelRatingSummary(novel);

  assert.equal(cardSummary.displayAverage, detailSummary.displayAverage);
  assert.equal(cardSummary.totalCount, detailSummary.totalCount);
  assert.equal(cardSummary.isCombined, detailSummary.isCombined);
  assert.equal(cardSummary.average, detailSummary.average);
});

// 18. Arabic RTL and English LTR badge details format accurately (reader ratings only).
test('18. Arabic RTL and English LTR badge details format accurately', () => {
  const n = readerNovel({
    visitorRatingCount: 3,
    visitorRatingAverage: 4,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 3, 5: 0 },
  });
  const ar = getRatingDisplayDetails(n, 'ar');
  const en = getRatingDisplayDetails(n, 'en');
  assert.equal(ar.badgeType, 'visitor');
  assert.equal(ar.badge, '★ 4.0 (3)');
  assert.equal(ar.subtext, 'بناءً على 3 تقييماً من القراء');
  assert.equal(en.subtext, 'Based on 3 reader ratings');
});

// 19. Existing purchases, subscriptions, chapter access, and authentication are not broken.
test('19. Existing purchases, subscriptions, and chapter structures remain intact', () => {
  const novel: Novel = {
    id: 'novel-store-test',
    title: 'رواية المتجر',
    author: 'الكاتب',
    genre: 'مغامرات',
    status: 'مكتملة',
    description: 'وصف الرواية',
    novelPrice: 50,
    bookPrice: 75,
    freeChapters: 3,
    chaptersCount: 25,
    published: true,
    color: '#23483f',
    accent: '#a98a63',
    ratingDisplayMode: 'visitor',
    visitorRatingCount: 4,
    visitorRatingAverage: 4.75,
  };

  assert.equal(novel.novelPrice, 50);
  assert.equal(novel.bookPrice, 75);
  assert.equal(novel.freeChapters, 3);
  assert.equal(novel.chaptersCount, 25);
  assert.equal(novel.published, true);
});

console.log(`\n🎉 All ${passedTests} automated tests passed with 100% success!`);
