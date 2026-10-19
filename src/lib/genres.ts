import { translations } from '../i18n/translations';
import type { Language } from '../types';

/**
 * Built-in genres a novel can carry.
 * The admin can add MORE genres from the dashboard (Settings → Genres); those are stored in
 * `settings/site.customGenres` and merged in through the registry below, so no code change is needed.
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

/** A genre added by the admin. `key` is the canonical (Arabic) name, `en` its English label. */
export interface CustomGenre {
  key: string;
  en: string;
}

/** Limits for admin-added genres. */
export const MAX_CUSTOM_GENRES = 30;
export const MAX_GENRE_NAME_LENGTH = 30;

let customGenres: CustomGenre[] = [];

/** Cleans the stored list: valid strings only, no duplicates, no clash with built-ins, capped. */
export function sanitizeCustomGenres(list: unknown): CustomGenre[] {
  if (!Array.isArray(list)) return [];
  const out: CustomGenre[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as { key?: unknown; en?: unknown };
    const key = typeof raw.key === 'string' ? raw.key.trim().slice(0, MAX_GENRE_NAME_LENGTH) : '';
    // `translations.ar.genres` also holds 'الكل' and the English aliases, which must stay reserved
    if (!key || translations.ar.genres[key] || out.some(g => g.key === key)) continue;
    const en = typeof raw.en === 'string' ? raw.en.trim().slice(0, MAX_GENRE_NAME_LENGTH) : '';
    out.push({ key, en: en || key });
    if (out.length >= MAX_CUSTOM_GENRES) break;
  }
  return out;
}

/** Called once the site settings are loaded (and after the admin edits the list). */
export function setCustomGenres(list: unknown): void {
  customGenres = sanitizeCustomGenres(list);
}

export function getCustomGenres(): CustomGenre[] {
  return customGenres;
}

/** Built-in genres followed by the admin-added ones. */
export function getAllGenreKeys(): string[] {
  return [...GENRE_KEYS, ...customGenres.map(g => g.key)];
}

/** Display name of one genre key in the given language (works for built-in and custom genres). */
export function genreLabel(key: string, lang: Language): string {
  if (lang === 'en') {
    return translations.en.genres[key] || customGenres.find(g => g.key === key)?.en || key;
  }
  return translations.ar.genres[key] || key;
}

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
  const custom = customGenres.find(g => g.en === genre);
  if (custom && all.includes(custom.key)) return true;
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
      return genreLabel(key, 'en');
    }
    return genreLabel(key, 'ar');
  });
}

/**
 * Fields to store when the admin picks genres: `genres` (all) plus `genre` / `genreEn`
 * (the first one) so older code and older data keep working.
 */
export function genreFieldsForSave(list: unknown): { genres: string[]; genre: string; genreEn: string } {
  const genres = normalizeGenres(list);
  const first = genres[0] || '';
  return { genres, genre: first, genreEn: genreLabel(first, 'en') };
}
