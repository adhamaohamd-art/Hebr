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
