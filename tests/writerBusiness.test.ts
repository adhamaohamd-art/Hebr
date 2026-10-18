import assert from 'node:assert/strict';
import { test } from 'node:test';
import { releaseStatus, RELEASE_INTERVAL_MS, formatWait } from '../src/lib/releaseSchedule';
import { splitLine, allocateDiscount, summarizeSales, cleanSharePercent } from '../src/lib/earnings';
import { computeCartDiscount, couponAppliesToItem } from '../src/lib/couponScope';

const T = 1_800_000_000_000;

test('first 3 chapters are free to release, then 1 every 3 days', () => {
  assert.deepEqual(releaseStatus(0, 0, T), { canRelease: true, remainingFirstBatch: 3, nextAllowedAtMs: null, waitMs: 0 });
  assert.equal(releaseStatus(2, T, T).canRelease, true);
  assert.equal(releaseStatus(2, T, T).remainingFirstBatch, 1);
  const blocked = releaseStatus(3, T, T + 1000);
  assert.equal(blocked.canRelease, false);
  assert.equal(blocked.nextAllowedAtMs, T + RELEASE_INTERVAL_MS);
  assert.equal(blocked.waitMs, RELEASE_INTERVAL_MS - 1000);
  assert.equal(releaseStatus(3, T, T + RELEASE_INTERVAL_MS).canRelease, true);
  assert.equal(releaseStatus(10, T, T + 10 * RELEASE_INTERVAL_MS).canRelease, true);
});

test('formatWait', () => {
  assert.equal(formatWait(2 * 86400000 + 5 * 3600000, true), '2 يوم و5 ساعة');
  assert.equal(formatWait(90 * 60000, false), '1h 30m');
});

test('writer share is 70% by default of what was really paid', () => {
  assert.equal(cleanSharePercent(undefined), 70);
  assert.equal(cleanSharePercent(150), 100);
  const l = splitLine(100, 20, 70);
  assert.deepEqual(l, { gross: 100, discount: 20, net: 80, writerShare: 56, platformShare: 24 });
});

test('discount allocation adds up and skips ineligible lines', () => {
  const parts = allocateDiscount([100, 50, 30], [true, true, false], 30);
  assert.equal(parts[2], 0);
  assert.equal(Math.round((parts[0] + parts[1]) * 100) / 100, 30);
  assert.deepEqual(allocateDiscount([100], [false], 20), [0]);
  assert.deepEqual(allocateDiscount([10], [true], 50), [10]);
});

test('summarizeSales', () => {
  const r = summarizeSales([
    { novelId: 'a', net: 80, writerShare: 56 },
    { novelId: 'a', net: 40, writerShare: 28 },
    { novelId: 'b', net: 10, writerShare: 7 },
  ]);
  assert.equal(r.writerShare, 91);
  assert.equal(r.byNovel.a.count, 2);
});

test('writer coupon only discounts its own novel', () => {
  const coupon = { type: 'percent' as const, value: 50, novelId: 'n1' };
  const items = [
    { type: 'novel' as const, refId: 'n1', price: 100 },
    { type: 'novel' as const, refId: 'n2', price: 100 },
    { type: 'plan' as const, refId: 'n1', price: 100 },
  ];
  assert.equal(computeCartDiscount(items, coupon), 50);
  assert.equal(couponAppliesToItem(coupon, items[2]), false);
  assert.equal(computeCartDiscount(items, { type: 'percent', value: 10, novelId: undefined }), 30);
  assert.equal(computeCartDiscount(items, { type: 'fixed', value: 500, novelId: 'n2' }), 100);
});
