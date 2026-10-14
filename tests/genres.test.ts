import assert from 'node:assert/strict';
import {
  GENRE_KEYS,
  MAX_GENRES,
  normalizeGenres,
  getNovelGenres,
  novelHasGenre,
  getLocalizedGenres,
  genreFieldsForSave,
} from '../src/lib/genres';
import { translations } from '../src/i18n/translations';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ Passed: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ Failed: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

test('1. Every genre key has an Arabic and an English label', () => {
  for (const key of GENRE_KEYS) {
    assert.ok(translations.ar.genres[key], `ar label for ${key}`);
    assert.ok(translations.en.genres[key], `en label for ${key}`);
  }
  assert.ok((GENRE_KEYS as readonly string[]).includes('أكشن'), 'action genre exists');
});

test('2. A novel can carry several genres', () => {
  const novel = { genre: 'رومانسية', genres: ['رومانسية', 'فانتازيا', 'أكشن'] };
  assert.deepEqual(getNovelGenres(novel), ['رومانسية', 'فانتازيا', 'أكشن']);
  assert.ok(novelHasGenre(novel, 'فانتازيا'));
  assert.ok(novelHasGenre(novel, 'أكشن'));
  assert.equal(novelHasGenre(novel, 'غموض'), false);
});

test('3. Old novels with only `genre` keep working (no migration needed)', () => {
  const legacy = { genre: 'دراما' };
  assert.deepEqual(getNovelGenres(legacy), ['دراما']);
  assert.ok(novelHasGenre(legacy, 'دراما'));
  assert.deepEqual(getLocalizedGenres({ genre: 'دراما' }, 'en'), ['Drama']);
  assert.deepEqual(getNovelGenres({ genre: '' }), []);
  assert.deepEqual(getNovelGenres({}), []);
});

test('4. normalizeGenres trims, removes duplicates and non-strings, and caps the count', () => {
  assert.deepEqual(normalizeGenres([' دراما ', 'دراما', '', 5, null, 'غموض']), ['دراما', 'غموض']);
  const many = normalizeGenres(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  assert.equal(many.length, MAX_GENRES);
  assert.deepEqual(normalizeGenres('not-an-array'), []);
  assert.deepEqual(normalizeGenres(undefined), []);
});

test('5. English filter names match too (e.g. "Romance" finds a romance novel)', () => {
  const novel = { genre: 'رومانسية', genres: ['رومانسية', 'أكشن'] };
  assert.ok(novelHasGenre(novel, 'Romance'));
  assert.ok(novelHasGenre(novel, 'Action'));
  assert.equal(novelHasGenre(novel, 'Mystery'), false);
  assert.equal(novelHasGenre(novel, ''), false);
});

test('6. Localized names follow the reader language', () => {
  const novel = { genre: 'رومانسية', genres: ['رومانسية', 'فانتازيا', 'أكشن'] };
  assert.deepEqual(getLocalizedGenres(novel, 'ar'), ['رومانسية', 'فانتازيا', 'أكشن']);
  assert.deepEqual(getLocalizedGenres(novel, 'en'), ['Romance', 'Fantasy', 'Action']);
});

test('7. Saving keeps genre/genreEn = the first genre, so older code still works', () => {
  const f = genreFieldsForSave(['فانتازيا', 'أكشن', 'فانتازيا']);
  assert.deepEqual(f.genres, ['فانتازيا', 'أكشن']);
  assert.equal(f.genre, 'فانتازيا');
  assert.equal(f.genreEn, 'Fantasy');
});

console.log(`\n🎉 All ${passed} genre tests passed!`);
