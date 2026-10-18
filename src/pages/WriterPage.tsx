import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, BookOpen, Send, Undo2, Feather, AlertCircle, BadgeDollarSign } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { Cover } from '../components/Cover';
import { LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { writerService, WriterNovelInput } from '../services/writerService';
import { LIMITS } from '../config';
import { GENRE_KEYS, MAX_GENRES, getNovelGenres } from '../lib/genres';
import { canCreateNovel, remainingNovels } from '../lib/writer';
import { getFriendlyErrorMessage } from '../lib/firebase';
import { ChapterMeta, Novel } from '../types';
import { releaseStatus } from '../lib/releaseSchedule';
import { ReleaseBanner, PricingModal, EarningsPanel, CouponsPanel, PlanRequestsPanel } from '../components/WriterPanels';

type NovelForm = WriterNovelInput & { id?: string };

interface ChapterForm {
  id?: string;
  number: number;
  title: string;
  titleEn: string;
  body: string;
  published: boolean;
}

const emptyNovelForm = (authorName: string): NovelForm => ({
  title: '',
  titleEn: '',
  author: authorName,
  authorEn: '',
  genres: [GENRE_KEYS[0]],
  status: 'مستمرة',
  description: '',
  descriptionEn: '',
  coverUrl: '',
  color: '#314f49',
  accent: '#d9bb91',
});

function toMillisAny(v: unknown): number {
  const x = v as { toMillis?: () => number } | number | null | undefined;
  if (typeof x === 'number') return x;
  return x?.toMillis?.() ?? 0;
}

function novelStatus(novel: Novel, ar: boolean): { label: string; cls: string } {
  const rs = novel.reviewStatus || 'draft';
  if (novel.published) return { label: ar ? 'منشورة' : 'Published', cls: 'bg-emerald-100 text-emerald-800' };
  if (rs === 'pending') return { label: ar ? 'قيد المراجعة' : 'In review', cls: 'bg-amber-100 text-amber-900' };
  if (rs === 'rejected') return { label: ar ? 'مرفوضة' : 'Rejected', cls: 'bg-red-100 text-red-800' };
  if (rs === 'approved') return { label: ar ? 'معتمدة (غير منشورة)' : 'Approved (unpublished)', cls: 'bg-stone-200 text-stone-700' };
  return { label: ar ? 'مسودة' : 'Draft', cls: 'bg-stone-200 text-stone-700' };
}

export const WriterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, writerLimit, emailVerified } = useAuth();
  const { t, language } = useLanguage();
  const ar = language === 'ar';

  const [novels, setNovels] = useState<Novel[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [novelForm, setNovelForm] = useState<NovelForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Novel | null>(null);

  // Chapter manager
  const [chaptersOf, setChaptersOf] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chapterForm, setChapterForm] = useState<ChapterForm | null>(null);
  const [pricingOf, setPricingOf] = useState<Novel | null>(null);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const explain = useCallback(
    (err: unknown): string => {
      const code = (err as { code?: string } | null)?.code || '';
      if (code.includes('permission-denied')) {
        return ar
          ? 'تم رفض العملية. تأكد من تأكيد بريدك الإلكتروني، ومن أنك لم تتجاوز حد الروايات المسموح لك، ومن أن قواعد Firestore الجديدة منشورة.'
          : 'The action was refused. Check that your email is verified, that you are within your novel limit, and that the new Firestore rules are deployed.';
      }
      if (code) return getFriendlyErrorMessage(err, language);
      return err instanceof Error && err.message ? err.message : getFriendlyErrorMessage(err, language);
    },
    [ar, language]
  );

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [list, stats] = await Promise.all([writerService.getMyNovels(user.uid), writerService.getStats(user.uid)]);
      setNovels(list);
      // The counter is the quota's source of truth; never show less than the novels we can actually see.
      setCount(Math.max(stats.novelCount, list.length));
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(explain(err));
    } finally {
      setLoading(false);
    }
  }, [user, explain]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    load();
  }, [authLoading, user, load]);

  useEffect(() => {
    setChaptersOf(cur => (cur ? novels.find(n => n.id === cur.id) || cur : cur));
  }, [novels]);

  if (authLoading || (user && loading && novels.length === 0 && !errorMsg)) {
    return <LoadingState message={t.common.loading} />;
  }

  if (!user) {
    return (
      <div className="page-container text-center py-16">
        <Feather size={32} className="mx-auto mb-4 text-[var(--bronze)]" />
        <h1 className="font-serif text-2xl mb-3">{ar ? 'لوحة الكاتب' : 'Writer studio'}</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          {ar ? 'سجّل الدخول أولًا للوصول إلى لوحة الكاتب.' : 'Sign in first to open the writer studio.'}
        </p>
        <Link to="/login" className="primary-button">{t.common.login}</Link>
      </div>
    );
  }

  // Not a writer (no personal quota, no plan with a writer quota) and nothing written before.
  if (writerLimit === 0 && novels.length === 0) {
    return (
      <div className="page-container text-center py-16 max-w-xl mx-auto">
        <Feather size={32} className="mx-auto mb-4 text-[var(--bronze)]" />
        <h1 className="font-serif text-2xl mb-3">{ar ? 'حساب الكاتب' : 'Writer account'}</h1>
        <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
          {ar
            ? 'هذه اللوحة متاحة للكتّاب فقط. يمكنك الحصول على حساب كاتب من خلال الاشتراك في الباقة التي تتضمن النشر، أو بطلب ذلك من فريق حبر.'
            : 'This studio is for writers. You can get a writer account through the plan that includes publishing, or by asking the Hebr team.'}
        </p>
        <Link to="/plans" className="primary-button">{ar ? 'عرض الباقات' : 'See plans'}</Link>
      </div>
    );
  }

  const canCreate = canCreateNovel(writerLimit, count) && emailVerified;
  const left = remainingNovels(writerLimit, count);

  // ------------------------------------------------------------------ novel handlers
  const openNewNovel = () => setNovelForm(emptyNovelForm(profile?.name || ''));

  const openEditNovel = (n: Novel) =>
    setNovelForm({
      id: n.id,
      title: n.title || '',
      titleEn: n.titleEn || '',
      author: n.author || '',
      authorEn: n.authorEn || '',
      genres: getNovelGenres(n),
      status: n.status,
      description: n.description || '',
      descriptionEn: n.descriptionEn || '',
      coverUrl: n.coverUrl || '',
      color: n.color || '#314f49',
      accent: n.accent || '#d9bb91',
    });

  const handleSaveNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novelForm) return;
    try {
      setSaving(true);
      setErrorMsg('');
      if (novelForm.id) {
        await writerService.updateNovel(novelForm.id, novelForm);
      } else {
        await writerService.createNovel(user.uid, novelForm, writerLimit);
      }
      setNovelForm(null);
      toast(t.common.success);
      await load();
    } catch (err) {
      setErrorMsg(explain(err));
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (n: Novel, status: 'draft' | 'pending') => {
    if (status === 'pending' && !(n.chaptersCount > 0)) {
      setErrorMsg(ar ? 'أضف فصلًا واحدًا منشورًا على الأقل قبل إرسال الرواية للمراجعة.' : 'Add at least one published chapter before sending the novel for review.');
      return;
    }
    try {
      setErrorMsg('');
      await writerService.setReviewStatus(n.id, status);
      toast(
        status === 'pending'
          ? ar ? 'تم إرسال الرواية للمراجعة. ستظهر للقراء بعد اعتماد الإدارة.' : 'Sent for review. It will go public once the admin approves it.'
          : ar ? 'تم سحب الرواية من المراجعة.' : 'Taken back from review.'
      );
      await load();
    } catch (err) {
      setErrorMsg(explain(err));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setErrorMsg('');
      await writerService.deleteNovel(user.uid, deleteTarget.id);
      toast(t.common.success);
      await load();
    } catch (err) {
      setErrorMsg(explain(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  // ------------------------------------------------------------------ chapter handlers
  const openChapters = async (n: Novel) => {
    setChaptersOf(n);
    setChapterForm(null);
    setChapters([]);
    try {
      setChaptersLoading(true);
      setChapters(await writerService.getChapters(n.id));
    } catch (err) {
      setErrorMsg(explain(err));
    } finally {
      setChaptersLoading(false);
    }
  };

  const refreshChapters = async () => {
    if (!chaptersOf) return;
    setChapters(await writerService.getChapters(chaptersOf.id));
    await load();
  };

  const openNewChapter = () => {
    const next = chapters.reduce((m, c) => Math.max(m, c.number || 0), 0) + 1;
    const canRelease = chaptersOf ? releaseStatus(chaptersOf.releaseCount, toMillisAny(chaptersOf.lastReleaseAt)).canRelease : true;
    setChapterForm({ number: next, title: '', titleEn: '', body: '', published: canRelease });
  };

  const openEditChapter = async (c: ChapterMeta) => {
    try {
      const body = await writerService.getChapterBody(c.id);
      setChapterForm({ id: c.id, number: c.number, title: c.title || '', titleEn: c.titleEn || '', body, published: c.published });
    } catch (err) {
      setErrorMsg(explain(err));
    }
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chaptersOf || !chapterForm) return;
    try {
      setSaving(true);
      setErrorMsg('');
      // If releasing is not open yet, the chapter is saved as a draft instead of failing.
      const wasPublished = chapters.find(c => c.id === chapterForm.id)?.published === true;
      const canRelease = releaseStatus(chaptersOf.releaseCount, toMillisAny(chaptersOf.lastReleaseAt)).canRelease;
      const publish = chapterForm.published && (wasPublished || canRelease);
      await writerService.saveChapter(chaptersOf.id, { ...chapterForm, published: publish }, chapterForm.id);
      setChapterForm(null);
      toast(t.common.success);
      await refreshChapters();
    } catch (err) {
      setErrorMsg(explain(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChapter = async (c: ChapterMeta) => {
    if (!chaptersOf) return;
    if (!window.confirm(ar ? `حذف الفصل ${c.number}؟` : `Delete chapter ${c.number}?`)) return;
    try {
      setErrorMsg('');
      await writerService.deleteChapter(chaptersOf.id, c.id);
      await refreshChapters();
    } catch (err) {
      setErrorMsg(explain(err));
    }
  };

  const toggleGenre = (key: string) => {
    if (!novelForm) return;
    const has = novelForm.genres.includes(key);
    if (!has && novelForm.genres.length >= MAX_GENRES) return;
    setNovelForm({ ...novelForm, genres: has ? novelForm.genres.filter(g => g !== key) : [...novelForm.genres, key] });
  };

  const inputCls = 'w-full p-2 border border-[var(--line)] text-xs bg-white';

  return (
    <div className="page-container">
      <PageMeta title={ar ? 'لوحة الكاتب' : 'Writer studio'} />

      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <span className="eyebrow">{ar ? 'حساب الكاتب' : 'Writer account'}</span>
          <h1 className="font-serif text-3xl font-medium">{ar ? 'لوحة الكاتب' : 'Writer studio'}</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {ar
              ? `روايات حسابك: ${count} من ${writerLimit} ${left > 0 ? `(متبقي ${left})` : ''}`
              : `Your novels: ${count} of ${writerLimit} ${left > 0 ? `(${left} left)` : ''}`}
          </p>
        </div>
        <button className="primary-button" onClick={openNewNovel} disabled={!canCreate} title={!canCreate ? (ar ? 'وصلت للحد الأقصى أو بريدك غير مؤكد' : 'Limit reached or email not verified') : undefined}>
          <Plus size={16} /> {ar ? 'رواية جديدة' : 'New novel'}
        </button>
      </div>

      {!emailVerified && (
        <div className="mb-4 p-3 bg-amber-50 text-amber-900 border border-amber-200 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          {ar ? 'أكّد بريدك الإلكتروني أولًا حتى تتمكن من إنشاء رواية.' : 'Verify your email first so you can create a novel.'}
        </div>
      )}
      {writerLimit > 0 && count >= writerLimit && (
        <div className="mb-4 p-3 bg-stone-50 text-stone-700 border border-stone-200 text-xs">
          {ar ? 'وصلت للحد الأقصى من الروايات. احذف رواية أو ارفع باقتك لإضافة المزيد.' : 'You reached your novel limit. Delete a novel or upgrade your plan to add more.'}
        </div>
      )}
      {writerLimit === 0 && (
        <div className="mb-4 p-3 bg-stone-50 text-stone-700 border border-stone-200 text-xs">
          {ar ? 'انتهى اشتراك الكتابة. تستطيع تعديل رواياتك الحالية لكن لا يمكنك إنشاء روايات جديدة حتى تجدد الاشتراك.' : 'Your writer subscription ended. You can still edit your current novels but cannot create new ones until you renew.'}
        </div>
      )}
      {toastMsg && <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs">{toastMsg}</div>}
      {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">{errorMsg}</div>}

      <div className="mb-6 p-3 bg-stone-50 border border-[var(--line)] text-xs text-[var(--muted)] leading-relaxed">
        {ar
          ? 'تُحفظ رواياتك كمسودات خاصة بك. عند الانتهاء اضغط «إرسال للمراجعة»، وتظهر للقراء بعد اعتماد الإدارة لها. أنت تحدد سعر رواياتك وفصولها المجانية من زر «التسعير». النشر: أول 3 فصول لكل رواية بلا انتظار، ثم فصل واحد كل 3 أيام.'
          : 'Your novels are private drafts. When ready, press “Send for review”; they go public after the admin approves them. You set your own price and free chapters with the “Pricing” button. Releasing: the first 3 chapters of each novel have no wait, then one chapter every 3 days.'}
      </div>

      {/* ---------------- Novels list ---------------- */}
      {novels.length === 0 ? (
        <div className="p-10 text-center text-sm text-[var(--muted)] border border-[var(--line)]">
          {ar ? 'لم تكتب أي رواية بعد. ابدأ بـ «رواية جديدة».' : 'No novels yet. Start with “New novel”.'}
        </div>
      ) : (
        <div className="space-y-3">
          {novels.map(n => {
            const st = novelStatus(n, ar);
            const rs = n.reviewStatus || 'draft';
            return (
              <div key={n.id} className="bg-white border border-[var(--line)] p-4 flex flex-wrap gap-4 items-center">
                <div className="w-14 shrink-0"><Cover novel={n} /></div>
                <div className="flex-1 min-w-[200px]">
                  <b className="block">{n.title}</b>
                  <small className="text-[var(--muted)]">
                    {n.chaptersCount || 0} {t.common.chaptersCount} ·{' '}
                    {n.isFreeNovel
                      ? ar ? 'مجانية بالكامل' : 'Fully free'
                      : `${n.novelPrice || 0} ${ar ? 'ج.م' : 'EGP'}${(n.freeChapters || 0) > 0 ? (ar ? ` · ${n.freeChapters} فصول مجانية` : ` · ${n.freeChapters} free`) : ''}`}
                    {n.priceLocked ? (ar ? ' · السعر مقفول من الإدارة' : ' · price locked by admin') : ''}
                  </small>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 text-[11px] ${st.cls}`}>{st.label}</span>
                  </div>
                  {rs === 'rejected' && n.reviewNote && (
                    <p className="text-[11px] text-red-700 mt-1">{ar ? 'ملاحظة الإدارة: ' : 'Admin note: '}{n.reviewNote}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="outline-button small" onClick={() => openChapters(n)}>
                    <BookOpen size={14} /> {ar ? 'الفصول' : 'Chapters'}
                  </button>
                  <button className="outline-button small" onClick={() => setPricingOf(n)}>
                    <BadgeDollarSign size={14} /> {ar ? 'التسعير' : 'Pricing'}
                  </button>
                  <button className="outline-button small" onClick={() => openEditNovel(n)}>
                    <Edit2 size={14} /> {t.common.edit}
                  </button>
                  {(rs === 'draft' || rs === 'rejected') && !n.published && (
                    <button className="primary-button small" onClick={() => handleReview(n, 'pending')}>
                      <Send size={14} /> {ar ? 'إرسال للمراجعة' : 'Send for review'}
                    </button>
                  )}
                  {rs === 'pending' && !n.published && (
                    <button className="outline-button small" onClick={() => handleReview(n, 'draft')}>
                      <Undo2 size={14} /> {ar ? 'سحب من المراجعة' : 'Take back'}
                    </button>
                  )}
                  <button className="p-2 text-red-600 hover:text-red-800" onClick={() => setDeleteTarget(n)} aria-label={t.common.delete} title={t.common.delete}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- Earnings / discounts / plan requests ---------------- */}
      {novels.length > 0 && (
        <>
          <EarningsPanel uid={user.uid} novels={novels} ar={ar} />
          <CouponsPanel uid={user.uid} novels={novels} ar={ar} explain={explain} />
          <PlanRequestsPanel uid={user.uid} ownerName={profile?.name || user.email || ''} novels={novels} ar={ar} explain={explain} />
        </>
      )}

      {pricingOf && (
        <PricingModal
          novel={pricingOf}
          ar={ar}
          explain={explain}
          onClose={() => setPricingOf(null)}
          onSaved={() => {
            toast(t.common.success);
            load();
          }}
        />
      )}

      {/* ---------------- Delete confirm ---------------- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--line)] max-w-md w-full p-6 text-start shadow-xl">
            <h3 className="font-serif text-lg font-medium mb-2">{ar ? 'حذف الرواية نهائيًا؟' : 'Delete this novel for good?'}</h3>
            <p className="text-xs text-[var(--muted)] mb-6">
              <strong>{deleteTarget.title}</strong>
              <br />
              {ar ? 'سيتم حذف كل فصولها، وسيعود لك مكان في الحد المسموح.' : 'All its chapters are deleted and the slot returns to your limit.'}
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" className="outline-button small" onClick={() => setDeleteTarget(null)}>{t.common.cancel}</button>
              <button type="button" className="primary-button small bg-red-700 hover:bg-red-800 text-white" onClick={confirmDelete}>{t.common.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Novel form ---------------- */}
      {novelForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--line)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-start shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--line)] mb-4">
              <h3 className="font-serif text-xl font-medium">
                {novelForm.id ? (ar ? 'تعديل بيانات الرواية' : 'Edit novel') : (ar ? 'رواية جديدة' : 'New novel')}
              </h3>
              <button onClick={() => setNovelForm(null)} className="text-[var(--muted)] hover:text-black" aria-label={t.common.cancel}><X size={20} /></button>
            </div>
            {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">{errorMsg}</div>}
            <form onSubmit={handleSaveNovel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">{ar ? 'عنوان الرواية (عربي)' : 'Title (Arabic)'}</label>
                  <input required maxLength={LIMITS.novelTitleMax} value={novelForm.title} onChange={e => setNovelForm({ ...novelForm, title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{ar ? 'العنوان بالإنجليزية (اختياري)' : 'Title (English, optional)'}</label>
                  <input maxLength={LIMITS.novelTitleMax} value={novelForm.titleEn || ''} onChange={e => setNovelForm({ ...novelForm, titleEn: e.target.value })} className={inputCls} dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{ar ? 'اسم الكاتب كما سيظهر' : 'Author name shown'}</label>
                  <input required maxLength={LIMITS.authorMax} value={novelForm.author} onChange={e => setNovelForm({ ...novelForm, author: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{ar ? 'اسم الكاتب بالإنجليزية (اختياري)' : 'Author name (English, optional)'}</label>
                  <input maxLength={LIMITS.authorMax} value={novelForm.authorEn || ''} onChange={e => setNovelForm({ ...novelForm, authorEn: e.target.value })} className={inputCls} dir="ltr" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{ar ? `التصنيفات (حتى ${MAX_GENRES})` : `Genres (up to ${MAX_GENRES})`}</label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_KEYS.map(key => {
                    const on = novelForm.genres.includes(key);
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => toggleGenre(key)}
                        className={`px-2.5 py-1 text-xs border ${on ? 'bg-[var(--green)] text-white border-[var(--green)]' : 'bg-white border-[var(--line)]'}`}
                      >
                        {t.genres[key] || key}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{ar ? 'حالة الرواية' : 'Status'}</label>
                <select value={novelForm.status} onChange={e => setNovelForm({ ...novelForm, status: e.target.value as 'مستمرة' | 'مكتملة' })} className={inputCls}>
                  <option value="مستمرة">{t.statusLabels['مستمرة']}</option>
                  <option value="مكتملة">{t.statusLabels['مكتملة']}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{ar ? 'وصف الرواية' : 'Description'}</label>
                <textarea required rows={3} maxLength={LIMITS.descriptionMax} value={novelForm.description} onChange={e => setNovelForm({ ...novelForm, description: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{ar ? 'الوصف بالإنجليزية (اختياري)' : 'Description (English, optional)'}</label>
                <textarea rows={2} maxLength={LIMITS.descriptionMax} value={novelForm.descriptionEn || ''} onChange={e => setNovelForm({ ...novelForm, descriptionEn: e.target.value })} className={inputCls} dir="ltr" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-stone-50 border border-[var(--line)]">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.colorPrimary}</label>
                  <input type="color" value={novelForm.color || '#314f49'} onChange={e => setNovelForm({ ...novelForm, color: e.target.value })} className="w-full h-8 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.colorAccent}</label>
                  <input type="color" value={novelForm.accent || '#d9bb91'} onChange={e => setNovelForm({ ...novelForm, accent: e.target.value })} className="w-full h-8 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{ar ? 'رابط الغلاف (https)' : 'Cover link (https)'}</label>
                  <input type="url" value={novelForm.coverUrl || ''} onChange={e => setNovelForm({ ...novelForm, coverUrl: e.target.value })} className={inputCls} dir="ltr" placeholder="https://" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
                <button type="button" className="outline-button small" onClick={() => setNovelForm(null)}>{t.common.cancel}</button>
                <button type="submit" className="primary-button small" disabled={saving}>{saving ? t.common.loading : t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- Chapter manager ---------------- */}
      {chaptersOf && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--line)] w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 text-start shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--line)] mb-4">
              <h3 className="font-serif text-xl font-medium">{ar ? 'فصول: ' : 'Chapters: '}{chaptersOf.title}</h3>
              <button onClick={() => { setChaptersOf(null); setChapterForm(null); }} className="text-[var(--muted)] hover:text-black" aria-label={t.common.cancel}><X size={20} /></button>
            </div>
            {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">{errorMsg}</div>}

            <ReleaseBanner novel={chaptersOf} ar={ar} />

            {!chapterForm ? (
              <>
                <div className="flex justify-end mb-3">
                  <button className="primary-button small" onClick={openNewChapter}><Plus size={14} /> {ar ? 'فصل جديد' : 'New chapter'}</button>
                </div>
                {chaptersLoading ? (
                  <p className="text-xs text-[var(--muted)] py-6 text-center">{t.common.loading}</p>
                ) : chapters.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] py-6 text-center">{ar ? 'لا توجد فصول بعد.' : 'No chapters yet.'}</p>
                ) : (
                  <div className="divide-y divide-[var(--line)] border border-[var(--line)]">
                    {chapters.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 text-sm">
                        <span className="w-8 text-[var(--muted)]">{String(c.number).padStart(2, '0')}</span>
                        <span className="flex-1">{c.title}</span>
                        <span className={`px-2 py-0.5 text-[11px] ${c.published ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                          {c.published ? (ar ? 'منشور' : 'Published') : (ar ? 'مسودة' : 'Draft')}
                        </span>
                        <button className="p-1 hover:text-[var(--green)]" onClick={() => openEditChapter(c)} aria-label={t.common.edit}><Edit2 size={15} /></button>
                        <button className="p-1 text-red-600 hover:text-red-800" onClick={() => handleDeleteChapter(c)} aria-label={t.common.delete}><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSaveChapter} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr_1fr] gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">{ar ? 'رقم الفصل' : 'Number'}</label>
                    <input type="number" min={1} max={500} required value={chapterForm.number} onChange={e => setChapterForm({ ...chapterForm, number: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">{ar ? 'عنوان الفصل' : 'Chapter title'}</label>
                    <input required maxLength={LIMITS.chapterTitleMax} value={chapterForm.title} onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">{ar ? 'العنوان بالإنجليزية (اختياري)' : 'Title (English, optional)'}</label>
                    <input maxLength={LIMITS.chapterTitleMax} value={chapterForm.titleEn} onChange={e => setChapterForm({ ...chapterForm, titleEn: e.target.value })} className={inputCls} dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {ar ? 'نص الفصل (افصل الفقرات بسطر فارغ)' : 'Chapter text (separate paragraphs with a blank line)'}
                    <span className="text-[var(--muted)]"> — {chapterForm.body.length}/{LIMITS.chapterBodyMax}</span>
                  </label>
                  <textarea required rows={14} maxLength={LIMITS.chapterBodyMax} value={chapterForm.body} onChange={e => setChapterForm({ ...chapterForm, body: e.target.value })} className={`${inputCls} leading-relaxed`} />
                </div>
                {(() => {
                  const wasPublished = chapters.find(c => c.id === chapterForm.id)?.published === true;
                  const canRelease = releaseStatus(chaptersOf.releaseCount, toMillisAny(chaptersOf.lastReleaseAt)).canRelease;
                  const blocked = !wasPublished && !canRelease;
                  return (
                    <label className={`flex items-center gap-2 text-xs ${blocked ? 'opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        disabled={blocked}
                        checked={blocked ? false : chapterForm.published}
                        onChange={e => setChapterForm({ ...chapterForm, published: e.target.checked })}
                      />
                      {blocked
                        ? ar ? 'النشر غير متاح الآن (انتظر الموعد المذكور أعلاه) — سيُحفظ كمسودة' : 'Releasing is not available yet (see the date above) — it will be saved as a draft'
                        : ar ? 'نشر الفصل (يظهر للقراء بعد اعتماد الرواية، ويُحتسب من حصة النشر)' : 'Release this chapter (visible once the novel is approved; counts toward your release schedule)'}
                    </label>
                  );
                })()}
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
                  <button type="button" className="outline-button small" onClick={() => setChapterForm(null)}>{t.common.cancel}</button>
                  <button type="submit" className="primary-button small" disabled={saving}>{saving ? t.common.loading : t.common.save}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 text-xs">
        <button className="underline text-[var(--muted)]" onClick={() => navigate('/library')}>{ar ? 'العودة إلى مكتبتي' : 'Back to my library'}</button>
      </div>
    </div>
  );
};
