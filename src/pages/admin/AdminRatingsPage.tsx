import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Search, Check, AlertCircle, RefreshCw, EyeOff, Eye, Trash2, Flag, Users } from 'lucide-react';
import { novelService } from '../../services/novelService';
import { reviewService } from '../../services/reviewService';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingState, ErrorState } from '../../components/States';
import { Novel, Review } from '../../types';
import { getLocalizedNovelField } from '../../i18n/translations';
import { getNovelRatingSummary } from '../../lib/rating';

type StatusFilter = 'all' | 'published' | 'hidden';
type Notice = { type: 'success' | 'error'; message: string } | null;

function formatDate(value: unknown, language: 'ar' | 'en'): string {
  try {
    const v = value as { toDate?: () => Date; toMillis?: () => number } | string | number | null | undefined;
    let d: Date | null = null;
    if (v && typeof v === 'object' && typeof v.toDate === 'function') d = v.toDate();
    else if (typeof v === 'string' || typeof v === 'number') d = new Date(v);
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export const AdminRatingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { language, rtl } = useLanguage();
  const ar = language === 'ar';
  const tr = (a: string, e: string) => (ar ? a : e);

  const adminUid = user?.uid || 'admin';
  const adminEmail = user?.email || profile?.email || 'admin@habr.app';

  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedNovelId, setSelectedNovelId] = useState('');
  const [search, setSearch] = useState('');

  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingNovel, setSavingNovel] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [starFilter, setStarFilter] = useState<number>(0);
  const [busyReviewId, setBusyReviewId] = useState('');
  const [hidingId, setHidingId] = useState('');
  const [hideReason, setHideReason] = useState('');

  const [notice, setNotice] = useState<Notice>(null);

  const loadNovels = useCallback(async (keepSelection = true) => {
    try {
      setLoadError('');
      const list = await novelService.getNovels();
      setNovels(list);
      setSelectedNovelId(prev => {
        const paramId = searchParams.get('novelId');
        if (keepSelection && prev && list.some(n => n.id === prev)) return prev;
        if (paramId && list.some(n => n.id === paramId)) return paramId;
        return list[0]?.id || '';
      });
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : tr('حدث خطأ', 'Something went wrong'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadNovels(false);
    settingsService
      .getSettings()
      .then(s => setGlobalEnabled(s.globalRatingsEnabled !== false))
      .catch(() => undefined);
  }, [loadNovels]);

  const selectedNovel = useMemo(() => novels.find(n => n.id === selectedNovelId) || null, [novels, selectedNovelId]);
  const summary = useMemo(() => (selectedNovel ? getNovelRatingSummary(selectedNovel) : null), [selectedNovel]);

  const loadReviews = useCallback(async (novelId: string) => {
    if (!novelId) {
      setReviews([]);
      return;
    }
    setReviewsLoading(true);
    try {
      const list = await reviewService.getAdminReviews({ novelId, limitCount: 300 });
      list.sort((a, b) => {
        const ta = (a.createdAt as { toMillis?: () => number } | null)?.toMillis?.() ?? 0;
        const tb = (b.createdAt as { toMillis?: () => number } | null)?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setReviews(list);
    } catch (err: unknown) {
      setReviews([]);
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : tr('تعذر تحميل التقييمات.', 'Could not load ratings.'),
      });
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews(selectedNovelId);
    setHidingId('');
    setHideReason('');
  }, [selectedNovelId, loadReviews]);

  const filteredNovels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return novels;
    return novels.filter(n => {
      const title = getLocalizedNovelField(n, 'title', language) || '';
      return title.toLowerCase().includes(q) || (n.author || '').toLowerCase().includes(q);
    });
  }, [novels, search, language]);

  const filteredReviews = useMemo(
    () =>
      reviews.filter(r => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (starFilter && r.rating !== starFilter) return false;
        return true;
      }),
    [reviews, statusFilter, starFilter]
  );

  const handleSelectNovel = (id: string) => {
    setSelectedNovelId(id);
    setSearchParams({ novelId: id });
    setNotice(null);
  };

  const handleToggleGlobal = async (enabled: boolean) => {
    setSavingGlobal(true);
    setNotice(null);
    try {
      await settingsService.updateSettings({ globalRatingsEnabled: enabled });
      setGlobalEnabled(enabled);
      setNotice({
        type: 'success',
        message: enabled ? tr('تم تفعيل التقييمات على المنصة.', 'Ratings enabled site-wide.') : tr('تم إيقاف التقييمات على المنصة.', 'Ratings disabled site-wide.'),
      });
    } catch {
      setNotice({ type: 'error', message: tr('تعذر حفظ الإعداد.', 'Could not save the setting.') });
    } finally {
      setSavingGlobal(false);
    }
  };

  // Saves the per-novel toggle. Also scrubs any legacy editorial / custom / admin values.
  const handleToggleNovel = async (enabled: boolean) => {
    if (!selectedNovel) return;
    setSavingNovel(true);
    setNotice(null);
    try {
      const res = await novelService.updateNovelRatingSettings(
        selectedNovel.id,
        {
          ratingDisplayMode: 'visitor',
          ratingsEnabled: enabled,
          adminRatingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          adminRatingEnabled: false,
          editorialRating: null,
          editorialReview: '',
          customRating: null,
        },
        { adminUid, adminEmail }
      );
      setNotice({ type: res.success ? 'success' : 'error', message: res.message });
      await loadNovels();
    } catch {
      setNotice({ type: 'error', message: tr('تعذر حفظ الإعداد.', 'Could not save the setting.') });
    } finally {
      setSavingNovel(false);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedNovel) return;
    setRecalculating(true);
    setNotice(null);
    try {
      await reviewService.recalculateNovelAggregates(selectedNovel.id);
      await loadNovels();
      setNotice({ type: 'success', message: tr('تمت إعادة حساب التقييمات من مراجعات القراء المنشورة.', 'Ratings recalculated from published reader reviews.') });
    } catch {
      setNotice({ type: 'error', message: tr('تعذرت إعادة الحساب.', 'Recalculation failed.') });
    } finally {
      setRecalculating(false);
    }
  };

  const handleResyncAll = async () => {
    if (!window.confirm(tr(
      'سيتم إعادة حساب تقييمات كل الروايات من مراجعات القراء وتحديث الصفحة الرئيسية. قد تستهلك عدداً من القراءات. متابعة؟',
      'This recalculates every novel\'s ratings from reader reviews and refreshes the home page. It uses a number of reads. Continue?'
    ))) return;
    setMaintenanceBusy(true);
    setNotice(null);
    try {
      const n = await reviewService.resyncAllNovelAggregates();
      await loadNovels();
      setNotice({ type: 'success', message: tr(`تمت مزامنة تقييمات ${n} رواية وتحديث الصفحة الرئيسية.`, `Synced ratings for ${n} novels and refreshed the home page.`) });
    } catch {
      setNotice({ type: 'error', message: tr('تعذرت المزامنة.', 'Sync failed.') });
    } finally {
      setMaintenanceBusy(false);
    }
  };

  const handleScrubEmails = async () => {
    setMaintenanceBusy(true);
    setNotice(null);
    try {
      const n = await reviewService.scrubReviewEmails();
      setNotice({ type: 'success', message: tr(`تم حذف الإيميل من ${n} مراجعة قديمة.`, `Removed the email from ${n} old reviews.`) });
    } catch {
      setNotice({ type: 'error', message: tr('تعذر تنظيف المراجعات القديمة.', 'Could not clean old reviews.') });
    } finally {
      setMaintenanceBusy(false);
    }
  };

  const runModeration = async (review: Review, action: 'hide' | 'publish' | 'delete', reason = '') => {
    setBusyReviewId(review.id);
    setNotice(null);
    const res = await reviewService.moderateReview(review.id, action, reason, adminUid, adminEmail);
    setNotice({ type: res.success ? 'success' : 'error', message: res.message });
    setBusyReviewId('');
    setHidingId('');
    setHideReason('');
    if (res.success) {
      await Promise.all([loadReviews(review.novelId), loadNovels()]);
    }
  };

  const handleDelete = (review: Review) => {
    const ok = window.confirm(
      tr(`حذف تقييم "${review.userName}" نهائياً؟ لا يمكن التراجع.`, `Permanently delete ${review.userName}'s review? This cannot be undone.`)
    );
    if (ok) runModeration(review, 'delete');
  };

  if (loading) return <LoadingState />;
  if (loadError) return <ErrorState error={loadError} onRetry={() => loadNovels(false)} />;

  const maxBar = summary ? Math.max(1, ...Object.values(summary.visitorDistribution)) : 1;
  const hiddenCount = reviews.filter(r => r.status === 'hidden').length;

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[var(--line)] p-6">
        <div className="flex items-center gap-2 text-amber-800 text-xs mb-1">
          <Star size={14} />
          <span>{tr('إدارة تقييمات القراء', 'Reader ratings management')}</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-[var(--green)]">{tr('التحكم في تقييمات القراء', 'Control reader ratings')}</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          {tr(
            'التقييمات تأتي من القراء فقط. يمكنك إخفاء أي تقييم أو إظهاره أو حذفه، ويُعاد حساب متوسط الرواية تلقائياً.',
            'Ratings come from readers only. You can hide, restore or delete any review and the novel average is recalculated automatically.'
          )}
        </p>
      </div>

      <div className="bg-white border border-[var(--line)] p-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={maintenanceBusy} onClick={handleResyncAll} className="outline-button small flex items-center gap-1.5">
          <RefreshCw size={13} className={maintenanceBusy ? 'animate-spin' : ''} />
          {tr('مزامنة كل التقييمات مع الصفحة الرئيسية', 'Sync all ratings to the home page')}
        </button>
        <button type="button" disabled={maintenanceBusy} onClick={handleScrubEmails} className="outline-button small">
          {tr('حذف الإيميلات من المراجعات القديمة (مرة واحدة)', 'Remove emails from old reviews (one-off)')}
        </button>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 p-3 text-sm border ${
            notice.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {notice.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Global switch */}
      <label className="flex items-start gap-3 bg-white border border-[var(--line)] p-4 cursor-pointer">
        <input
          type="checkbox"
          className="mt-1"
          checked={globalEnabled}
          disabled={savingGlobal}
          onChange={e => handleToggleGlobal(e.target.checked)}
        />
        <span>
          <b className="block text-sm text-stone-900">{tr('السماح بالتقييمات والمراجعات على المنصة كلها', 'Allow ratings and reviews site-wide')}</b>
          <small className="text-[11px] text-[var(--muted)]">
            {tr('عند الإيقاف لن يستطيع أي قارئ إضافة أو تعديل تقييم.', 'When off, no reader can add or edit a rating.')}
          </small>
        </span>
      </label>

      {novels.length === 0 ? (
        <div className="bg-white border border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">{tr('لا توجد روايات بعد.', 'No novels yet.')}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Novel list */}
          <aside className="lg:col-span-4 bg-white border border-[var(--line)] p-4 h-fit">
            <div className="relative mb-3">
              <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-stone-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tr('ابحث عن رواية...', 'Search novels...')}
                className="w-full border border-stone-300 ps-9 pe-3 py-2 text-sm"
              />
            </div>
            <ul className="space-y-1 max-h-[420px] overflow-y-auto">
              {filteredNovels.map(n => {
                const s = getNovelRatingSummary(n);
                const active = n.id === selectedNovelId;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectNovel(n.id)}
                      className={`w-full text-start p-3 border text-sm transition ${
                        active ? 'border-[var(--green)] bg-emerald-50/60' : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <b className="block text-stone-900 truncate">{getLocalizedNovelField(n, 'title', language)}</b>
                      <span className="text-[11px] text-[var(--muted)]">
                        {s.hasRatings
                          ? `★ ${s.displayAverage} · ${s.visitorCount} ${tr('تقييم', 'ratings')}`
                          : tr('لا توجد تقييمات', 'No ratings')}
                        {n.ratingsEnabled === false ? ` · ${tr('مغلقة', 'closed')}` : ''}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filteredNovels.length === 0 && <li className="text-xs text-[var(--muted)] p-2">{tr('لا نتائج.', 'No results.')}</li>}
            </ul>
          </aside>

          {/* Selected novel */}
          <section className="lg:col-span-8 space-y-6">
            {selectedNovel && summary && (
              <>
                <div className="bg-white border border-[var(--line)] p-6 space-y-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">{getLocalizedNovelField(selectedNovel, 'title', language)}</h3>
                      <p className="text-xs text-[var(--muted)]">{getLocalizedNovelField(selectedNovel, 'author', language)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRecalculate}
                      disabled={recalculating}
                      className="outline-button small flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} className={recalculating ? 'animate-spin' : ''} />
                      <span>{tr('إعادة حساب المتوسط', 'Recalculate average')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
                    <div className="text-center sm:border-e border-stone-200 pe-0 sm:pe-5">
                      <div className="font-serif text-4xl font-bold text-amber-700">{summary.hasRatings ? summary.displayAverage : '—'}</div>
                      <div className="text-xs text-[var(--muted)] mt-1 flex items-center justify-center gap-1">
                        <Users size={12} />
                        <span>
                          {summary.visitorCount} {tr('تقييم من القراء', 'reader ratings')}
                        </span>
                      </div>
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      {([5, 4, 3, 2, 1] as const).map(star => {
                        const count = summary.visitorDistribution[star];
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-8 text-stone-700">{star} ★</span>
                            <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500" style={{ width: `${(count / maxBar) * 100}%` }} />
                            </div>
                            <span className="w-8 text-end text-stone-600">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex items-start gap-3 pt-4 border-t border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedNovel.ratingsEnabled !== false}
                      disabled={savingNovel}
                      onChange={e => handleToggleNovel(e.target.checked)}
                    />
                    <span>
                      <b className="block text-sm text-stone-900">{tr('السماح للقراء بتقييم هذه الرواية', 'Let readers rate this novel')}</b>
                      <small className="text-[11px] text-[var(--muted)]">
                        {tr('عند الإيقاف تبقى التقييمات الحالية ظاهرة لكن لا يمكن إضافة جديد.', 'When off, existing ratings stay visible but no new ones can be added.')}
                      </small>
                    </span>
                  </label>
                </div>

                {/* Reader reviews */}
                <div className="bg-white border border-[var(--line)] p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      {tr('تقييمات ومراجعات القراء', 'Reader ratings & reviews')}{' '}
                      <span className="text-sm font-normal text-[var(--muted)]">
                        ({reviews.length}
                        {hiddenCount > 0 ? ` · ${hiddenCount} ${tr('مخفي', 'hidden')}` : ''})
                      </span>
                    </h3>
                    <div className="flex gap-2 text-xs">
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                        className="border border-stone-300 px-2 py-1.5 bg-white"
                      >
                        <option value="all">{tr('كل الحالات', 'All statuses')}</option>
                        <option value="published">{tr('منشور', 'Published')}</option>
                        <option value="hidden">{tr('مخفي', 'Hidden')}</option>
                      </select>
                      <select
                        value={starFilter}
                        onChange={e => setStarFilter(Number(e.target.value))}
                        className="border border-stone-300 px-2 py-1.5 bg-white"
                      >
                        <option value={0}>{tr('كل النجوم', 'All stars')}</option>
                        {[5, 4, 3, 2, 1].map(s => (
                          <option key={s} value={s}>
                            {s} ★
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {reviewsLoading ? (
                    <p className="text-sm text-[var(--muted)]">{tr('جاري التحميل...', 'Loading...')}</p>
                  ) : filteredReviews.length === 0 ? (
                    <p className="text-sm text-[var(--muted)] py-6 text-center">{tr('لا توجد تقييمات مطابقة.', 'No matching reviews.')}</p>
                  ) : (
                    <ul className="divide-y divide-stone-200">
                      {filteredReviews.map(r => {
                        const busy = busyReviewId === r.id;
                        const hidden = r.status === 'hidden';
                        return (
                          <li key={r.id} className={`py-4 space-y-2 ${hidden ? 'opacity-70' : ''}`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 text-sm">
                                <b className="text-stone-900">{r.userName}</b>
                                <span className="text-amber-600 tracking-wide">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                <span className="text-[11px] text-[var(--muted)]">{formatDate(r.createdAt, language)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                {(r.reportCount || 0) > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200">
                                    <Flag size={11} /> {r.reportCount}
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 border ${
                                    hidden ? 'bg-stone-100 text-stone-600 border-stone-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {hidden ? tr('مخفي', 'Hidden') : tr('منشور', 'Published')}
                                </span>
                              </div>
                            </div>

                            {r.reviewText && <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{r.reviewText}</p>}
                            {hidden && r.moderationReason && (
                              <p className="text-[11px] text-[var(--muted)]">
                                {tr('سبب الإخفاء:', 'Hidden because:')} {r.moderationReason}
                              </p>
                            )}

                            {hidingId === r.id ? (
                              <div className="flex gap-2 items-center flex-wrap">
                                <input
                                  autoFocus
                                  value={hideReason}
                                  onChange={e => setHideReason(e.target.value)}
                                  placeholder={tr('سبب الإخفاء (اختياري)', 'Reason (optional)')}
                                  className="flex-1 min-w-[180px] border border-stone-300 px-2 py-1.5 text-xs"
                                />
                                <button type="button" disabled={busy} onClick={() => runModeration(r, 'hide', hideReason)} className="primary-button small">
                                  {tr('تأكيد الإخفاء', 'Confirm hide')}
                                </button>
                                <button type="button" onClick={() => setHidingId('')} className="outline-button small">
                                  {tr('إلغاء', 'Cancel')}
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 flex-wrap">
                                {hidden ? (
                                  <button type="button" disabled={busy} onClick={() => runModeration(r, 'publish')} className="outline-button small flex items-center gap-1.5">
                                    <Eye size={13} /> {tr('إظهار', 'Restore')}
                                  </button>
                                ) : (
                                  <button type="button" disabled={busy} onClick={() => setHidingId(r.id)} className="outline-button small flex items-center gap-1.5">
                                    <EyeOff size={13} /> {tr('إخفاء', 'Hide')}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleDelete(r)}
                                  className="outline-button small flex items-center gap-1.5 !text-red-700 !border-red-300"
                                >
                                  <Trash2 size={13} /> {tr('حذف', 'Delete')}
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
