import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeWriterLimit, canCreateNovel, remainingNovels } from '../src/lib/writer';

const future = Date.now() + 86_400_000;
const past = Date.now() - 86_400_000;

test('no profile or no quota means not a writer', () => {
  assert.equal(computeWriterLimit(null, null), 0);
  assert.equal(computeWriterLimit({ subscription: null }, null), 0);
});

test('admin-granted personal quota is used', () => {
  assert.equal(computeWriterLimit({ writerLimit: 3, subscription: null }, null), 3);
  assert.equal(computeWriterLimit({ writerLimit: -2, subscription: null }, null), 0);
  assert.equal(computeWriterLimit({ writerLimit: Number.NaN, subscription: null }, null), 0);
});

test('an active plan with writerNovelLimit gives the quota', () => {
  const profile = { subscription: { planId: 'ultra', expiresAt: future } };
  assert.equal(computeWriterLimit(profile, { id: 'ultra', writerNovelLimit: 2 }), 2);
});

test('an expired subscription or a different plan gives nothing', () => {
  assert.equal(
    computeWriterLimit({ subscription: { planId: 'ultra', expiresAt: past } }, { id: 'ultra', writerNovelLimit: 2 }),
    0
  );
  assert.equal(
    computeWriterLimit({ subscription: { planId: 'basic', expiresAt: future } }, { id: 'ultra', writerNovelLimit: 2 }),
    0
  );
});

test('admin_grant subscriptions do not carry a writer quota', () => {
  assert.equal(
    computeWriterLimit({ subscription: { planId: 'admin_grant', expiresAt: future } }, { id: 'admin_grant', writerNovelLimit: 5 }),
    0
  );
});

test('the larger of personal and plan quota wins', () => {
  const profile = { writerLimit: 4, subscription: { planId: 'ultra', expiresAt: future } };
  assert.equal(computeWriterLimit(profile, { id: 'ultra', writerNovelLimit: 2 }), 4);
  assert.equal(computeWriterLimit({ writerLimit: 1, subscription: profile.subscription }, { id: 'ultra', writerNovelLimit: 2 }), 2);
});

test('canCreateNovel / remainingNovels', () => {
  assert.equal(canCreateNovel(2, 0), true);
  assert.equal(canCreateNovel(2, 1), true);
  assert.equal(canCreateNovel(2, 2), false);
  assert.equal(canCreateNovel(0, 0), false);
  assert.equal(remainingNovels(2, 1), 1);
  assert.equal(remainingNovels(2, 5), 0);
});
