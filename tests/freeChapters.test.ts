import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isWithinFreeChapters } from '../src/lib/freeChapters';

test('chapters up to freeChapters are free', () => {
  assert.equal(isWithinFreeChapters(1, 2), true);
  assert.equal(isWithinFreeChapters(2, 2), true);
  assert.equal(isWithinFreeChapters(3, 2), false);
});

test('missing, zero or invalid freeChapters means nothing is free by number', () => {
  assert.equal(isWithinFreeChapters(1, undefined), false);
  assert.equal(isWithinFreeChapters(1, null), false);
  assert.equal(isWithinFreeChapters(1, 0), false);
  assert.equal(isWithinFreeChapters(1, Number.NaN), false);
});

import { isChapterFree, isFreeNovel } from '../src/lib/freeChapters';

test('a fully free novel makes every chapter free', () => {
  assert.equal(isFreeNovel({ isFreeNovel: true }), true);
  assert.equal(isFreeNovel({ isFreeNovel: false }), false);
  assert.equal(isFreeNovel({}), false);
  assert.equal(isFreeNovel(null), false);
  assert.equal(isChapterFree(50, { freeChapters: 0, isFreeNovel: true }), true);
  assert.equal(isChapterFree(50, { freeChapters: 2, isFreeNovel: true }, false), true);
});

test('without the free-novel flag the old rules still apply', () => {
  assert.equal(isChapterFree(2, { freeChapters: 2 }), true);
  assert.equal(isChapterFree(3, { freeChapters: 2 }), false);
  assert.equal(isChapterFree(3, { freeChapters: 2 }, true), true);
  assert.equal(isChapterFree(1, undefined), false);
});
