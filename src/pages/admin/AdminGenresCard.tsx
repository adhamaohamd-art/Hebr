import React, { useState } from 'react';
import { Check, Plus, Tag, X } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useLanguage } from '../../context/LanguageContext';
import { useGenres } from '../../context/GenresContext';
import { translations } from '../../i18n/translations';
import {
  CustomGenre,
  GENRE_KEYS,
  MAX_CUSTOM_GENRES,
  MAX_GENRE_NAME_LENGTH,
  sanitizeCustomGenres,
} from '../../lib/genres';

/** Quick-add ideas shown as chips (hidden once added). */
const SUGGESTIONS: CustomGenre[] = [
  { key: 'رعب', en: 'Horror' },
  { key: 'خيال علمي', en: 'Sci-Fi' },
  { key: 'كوميدي', en: 'Comedy' },
  { key: 'جريمة', en: 'Crime' },
  { key: 'مغامرة', en: 'Adventure' },
  { key: 'سيرة ذاتية', en: 'Biography' },
];

/**
 * Lets the admin add / remove extra genres. They are saved in `settings/site.customGenres`
 * and picked up everywhere (browse filter, admin + writer novel forms) without touching the code.
 */
export const AdminGenresCard: React.FC = () => {
  const { language } = useLanguage();
  const { customGenres, applyCustomGenres } = useGenres();
  const ar = language === 'ar';

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; msg: string } | null>(null);

  const flash = (ok: boolean, msg: string) => {
    setNotice({ ok, msg });
    setTimeout(() => setNotice(null), 4000);
  };

  const persist = async (next: CustomGenre[]) => {
    try {
      setSaving(true);
      const clean = sanitizeCustomGenres(next);
      await settingsService.updateSettings({ customGenres: clean });
      applyCustomGenres(clean);
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      flash(false, ar ? 'تعذّر الحفظ، حاول مرة أخرى.' : 'Could not save, please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addGenre = async (genre: CustomGenre) => {
    const key = genre.key.trim();
    const en = genre.en.trim();
    if (!key) return;
    const reserved = (GENRE_KEYS as readonly string[]).includes(key) || !!translations.ar.genres[key];
    if (reserved || customGenres.some(g => g.key === key)) {
      flash(false, ar ? 'هذا التصنيف موجود بالفعل.' : 'This genre already exists.');
      return;
    }
    if (customGenres.length >= MAX_CUSTOM_GENRES) {
      flash(false, ar ? `الحد الأقصى ${MAX_CUSTOM_GENRES} تصنيف إضافي.` : `Maximum ${MAX_CUSTOM_GENRES} extra genres.`);
      return;
    }
    if (await persist([...customGenres, { key, en: en || key }])) {
      flash(true, ar ? `تمت إضافة «${key}».` : `Added "${key}".`);
    }
  };

  const removeGenre = async (genre: CustomGenre) => {
    const msg = ar
      ? `حذف تصنيف «${genre.key}»؟ الروايات التي تحمله ستحتفظ به، لكنه لن يظهر في الفلتر ولا في قوائم الاختيار.`
      : `Remove "${genre.key}"? Novels that already have it keep it, but it will no longer appear in the filter or pickers.`;
    if (!window.confirm(msg)) return;
    if (await persist(customGenres.filter(g => g.key !== genre.key))) {
      flash(true, ar ? 'تم حذف التصنيف.' : 'Genre removed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addGenre({ key: nameAr, en: nameEn });
    setNameAr('');
    setNameEn('');
  };

  const suggestions = SUGGESTIONS.filter(
    s => !customGenres.some(g => g.key === s.key) && !translations.ar.genres[s.key]
  );
  const inputCls = 'w-full p-2 border border-[var(--line)] text-xs bg-white';

  return (
    <div className="mt-6 bg-white p-6 border border-[var(--line)] space-y-4">
      <div>
        <h4 className="font-serif text-base font-medium text-[var(--green)] flex items-center gap-2">
          <Tag size={16} /> {ar ? 'التصنيفات' : 'Genres'}
        </h4>
        <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-1">
          {ar
            ? 'أضف تصنيفات جديدة (مثل رعب أو خيال علمي) وتظهر فورًا في فلتر التصفح وفي نماذج الروايات للأدمن والكُتّاب. التصنيفات الأساسية لا يمكن حذفها.'
            : 'Add new genres (e.g. Horror, Sci-Fi). They show up right away in the browse filter and in the novel forms for admins and writers. Built-in genres cannot be removed.'}
        </p>
      </div>

      {notice && (
        <div
          className={`p-3 border text-xs flex items-center gap-2 ${
            notice.ok
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          {notice.ok && <Check size={16} />} {notice.msg}
        </div>
      )}

      {/* Current genres */}
      <div className="flex flex-wrap gap-2">
        {GENRE_KEYS.map(key => (
          <span key={key} className="px-3 py-1 text-xs border border-[var(--line)] bg-stone-50 text-[var(--muted)]">
            {translations[language].genres[key] || key}
          </span>
        ))}
        {customGenres.map(g => (
          <span
            key={g.key}
            className="px-3 py-1 text-xs border border-[var(--green)] bg-white flex items-center gap-2"
          >
            {ar ? g.key : g.en}
            <button
              type="button"
              disabled={saving}
              onClick={() => removeGenre(g)}
              aria-label={ar ? `حذف ${g.key}` : `Remove ${g.en}`}
              className="text-[var(--muted)] hover:text-red-700 disabled:opacity-40"
            >
              <X size={13} />
            </button>
          </span>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">{ar ? 'الاسم بالعربية' : 'Arabic name'}</label>
          <input
            required
            maxLength={MAX_GENRE_NAME_LENGTH}
            value={nameAr}
            onChange={e => setNameAr(e.target.value)}
            placeholder={ar ? 'مثال: رعب' : 'e.g. رعب'}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            {ar ? 'الاسم بالإنجليزية (اختياري)' : 'English name (optional)'}
          </label>
          <input
            maxLength={MAX_GENRE_NAME_LENGTH}
            value={nameEn}
            onChange={e => setNameEn(e.target.value)}
            placeholder="Horror"
            dir="ltr"
            className={inputCls}
          />
        </div>
        <button type="submit" disabled={saving || !nameAr.trim()} className="primary-button">
          <Plus size={16} /> {ar ? 'إضافة' : 'Add'}
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[var(--muted)]">{ar ? 'اقتراحات سريعة:' : 'Quick add:'}</span>
          {suggestions.map(s => (
            <button
              type="button"
              key={s.key}
              disabled={saving}
              onClick={() => addGenre(s)}
              className="px-2.5 py-1 text-xs border border-dashed border-[var(--line)] hover:border-[var(--green)] disabled:opacity-40"
            >
              + {ar ? s.key : s.en}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
