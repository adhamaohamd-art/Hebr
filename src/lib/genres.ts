import { translations } from '../i18n/translations';
import type { Language } from '../types';

/**
 * Single source of truth for the genres a novel can carry.
 * To add a new genre: add its Arabic key here AND its labels in translations.ts (`genres`, ar + en).
 */
export const GENRE_KEYS = [
  'رومانسية',
  'دراما',
  'فانتازيا',
  'أكشن',
  'غموض',
  'اجتماعية',
  'تشويق',
  'تاريخي',
] as const;

/** Maximum number of genres one novel can have. */
export const MAX_GENRES = 5;

type GenreSource = { genre?: string | null; genres?: unknown };

/**
 * Cleans a genre list: strings only, trimmed, no duplicates, capped at MAX_GENRES.
 */
export function normalizeGenres(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== 'string') continue;
    const g = item.trim();
    if (g && !out.includes(g)) out.push(g);
    if (out.length >= MAX_GENRES) break;
  }
  return out;
}

/**
 * All genres of a novel (canonical Arabic keys).
 * Older novels only have the single `genre` field; they keep working with no migration.
 */
export function getNovelGenres(novel: GenreSource): string[] {
  const list = normalizeGenres(novel.genres);
  if (list.length > 0) return list;
  const single = typeof novel.genre === 'string' ? novel.genre.trim() : '';
  return single ? [single] : [];
}

/** True when the novel has this genre (matches the Arabic key or its English name). */
export function novelHasGenre(novel: GenreSource & { genreEn?: string | null }, genre: string): boolean {
  if (!genre) return false;
  const all = getNovelGenres(novel);
  if (all.includes(genre)) return true;
  // The filter may be an English alias (e.g. "Romance"): map it to the Arabic key
  const arKey = translations.ar.genres[genre];
  if (arKey && all.includes(arKey)) return true;
  return !!novel.genreEn && novel.genreEn === genre && all.length <= 1;
}

/**
 * Display names of every genre in the reader's language.
 * A legacy novel with a custom `genreEn` keeps showing it in English.
 */
export function getLocalizedGenres(
  novel: GenreSource & { genreEn?: string | null },
  lang: Language
): string[] {
  const keys = getNovelGenres(novel);
  const legacySingle = normalizeGenres(novel.genres).length === 0;
  return keys.map(key => {
    if (lang === 'en') {
      if (legacySingle && novel.genreEn?.trim()) return novel.genreEn;
      return translations.en.genres[key] || key;
    }
    return translations.ar.genres[key] || key;
  });
}

/**
 * Fields to store when the admin picks genres: `genres` (all) plus `genre` / `genreEn`
 * (the first one) so older code and older data keep working.
 */
export function genreFieldsForSave(list: unknown): { genres: string[]; genre: string; genreEn: string } {
  const genres = normalizeGenres(list);
  const first = genres[0] || '';
  return { genres, genre: first, genreEn: translations.en.genres[first] || first };
}
