import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Clock, Trash2, Tag, Wallet, Send, Lock } from 'lucide-react';
import { writerService } from '../services/writerService';
import { settingsService } from '../services/settingsService';
import { releaseStatus, formatWait, FIRST_RELEASE_BATCH, RELEASE_INTERVAL_DAYS } from '../lib/releaseSchedule';
import { summarizeSales, DEFAULT_WRITER_SHARE_PERCENT } from '../lib/earnings';
import { Coupon, Novel, Plan, PlanRequest, Sale } from '../types';

type Explain = (err: unknown) => string;

function toMs(v: unknown): number {
  const x = v as { toMillis?: () => number } | number | null | undefined;
  if (typeof x === 'number') return x;
  return x?.toMillis?.() ?? 0;
}

const inputCls = 'w-full p-2 border border-[var(--line)] text-xs bg-white';
const money = (n: number, ar: boolean) => `${Math.round(n * 100) / 100} ${ar ? 'ج.م' : 'EGP'}`;

/** Re-renders every 30s so the countdown stays honest. */
function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// ---------------------------------------------------------------------------- release banner

export const ReleaseBanner: React.FC<{ novel: Novel; ar: boolean }> = ({ novel, ar }) => {
  const now = useNow();
  const st = releaseStatus(novel.releaseCount, toMs(novel.lastReleaseAt), now);

  if (st.canRelease) {
    return (
      <div className="mb-4 p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs flex items-start gap-2">
        <Clock size={14} className="shrink-0 mt-0.5" />
        <span>
          {st.remainingFirstBatch > 0
            ? ar
              ? `تستطيع نشر ${st.remainingFirstBatch} ${st.remainingFirstBatch === 1 ? 'فصل' : 'فصول'} الآن (أول ${FIRST_RELEASE_BATCH} فصول لكل رواية بلا انتظار). بعدها فصل واحد كل ${RELEASE_INTERVAL_DAYS} أيام.`
              : `You can release ${st.remainingFirstBatch} chapter(s) right now (the first ${FIRST_RELEASE_BATCH} of each novel have no wait). After that, one chapter every ${RELEASE_INTERVAL_DAYS} days.`
            : ar
            ? 'تستطيع نشر فصل جديد الآن. بعد النشر تنتظر 3 أيام للفصل التالي.'
            : 'You can release a new chapter now. After releasing, wait 3 days for the next one.'}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 bg-amber-50 text-amber-900 border border-amber-200 text-xs flex items-start gap-2">
      <Clock size={14} className="shrink-0 mt-0.5" />
      <span>
        {ar
          ? `تستطيع نشر الفصل التالي بعد ${formatWait(st.waitMs, true)} (${new Date(st.nextAllowedAtMs!).toLocaleString('ar-EG')}). يمكنك كتابة فصول جديدة كمسودات في الأثناء ثم نشرها عند الموعد.`
          : `You can release the next chapter in ${formatWait(st.waitMs, false)} (${new Date(st.nextAllowedAtMs!).toLocaleString()}). Meanwhile you can write new chapters as drafts and release them then.`}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------- pricing modal

export const PricingModal: React.FC<{
  novel: Novel;
  ar: boolean;
  explain: Explain;
  onClose: () => void;
  onSaved: () => void;
}> = ({ novel, ar, explain, onClose, onSaved }) => {
  const locked = novel.priceLocked === true;
  const [novelPrice, setNovelPrice] = useState(String(novel.novelPrice ?? 0));
  const [bookPrice, setBookPrice] = useState(novel.bookPrice == null ? '' : String(novel.bookPrice));
  const [freeChapters, setFreeChapters] = useState(String(novel.freeChapters ?? 0));
  const [isFreeNovel, setIsFreeNovel] = useState(novel.isFreeNovel === true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await writerService.updatePricing(novel.id, {
        // when the admin locked the price we send the stored values untouched (the rules would refuse a change)
        novelPrice: locked ? novel.novelPrice ?? 0 : Number(novelPrice) || 0,
        bookPrice: locked ? novel.bookPrice ?? null : bookPrice.trim() === '' ? null : Number(bookPrice),
        freeChapters: Number(freeChapters) || 0,
        isFreeNovel,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(explain(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form onSubmit={save} className="bg-white border border-[var(--line)] w-full max-w-lg p-6 text-start shadow-xl">
        <div className="flex justify-between items-center pb-3 border-b border-[var(--line)] mb-4">
          <h3 className="font-serif text-xl font-medium">{ar ? 'التسعير والفصول المجانية' : 'Pricing & free chapters'}</h3>
          <button type="button" onClick={onClose} aria-label="close"><X size={20} /></button>
        </div>
        <p className="text-xs text-[var(--muted)] mb-4">{novel.title}</p>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">{error}</div>}
        {locked && (
          <div className="mb-4 p-3 bg-stone-50 border border-stone-200 text-xs flex items-start gap-2">
            <Lock size={14} className="shrink-0 mt-0.5" />
            {ar ? 'الإدارة قفلت سعر هذه الرواية. تستطيع تعديل الفصول المجانية فقط.' : 'The admin locked this novel’s price. You can only change the free chapters.'}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1">{ar ? 'سعر الرواية (ج.م)' : 'Novel price (EGP)'}</label>
            <input type="number" min={0} max={5000} className={inputCls} value={novelPrice} disabled={locked || isFreeNovel} onChange={e => setNovelPrice(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{ar ? 'سعر الكتاب الرقمي (اختياري)' : 'Digital book price (optional)'}</label>
            <input type="number" min={0} max={5000} className={inputCls} value={bookPrice} disabled={locked || isFreeNovel} onChange={e => setBookPrice(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer mb-4">
          <input type="checkbox" checked={isFreeNovel} onChange={e => setIsFreeNovel(e.target.checked)} />
          {ar ? 'رواية مجانية بالكامل (كل الفصول بلا مقابل)' : 'Fully free novel (every chapter free)'}
        </label>
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1">{ar ? 'عدد الفصول المجانية الأولى' : 'Number of free first chapters'}</label>
          <input type="number" min={0} max={500} className={inputCls} value={freeChapters} disabled={isFreeNovel} onChange={e => setFreeChapters(e.target.value)} />
          <small className="text-[var(--muted)]">{ar ? '0 = كل الفصول مدفوعة.' : '0 = every chapter is paid.'}</small>
        </div>
        <p className="text-[11px] text-[var(--muted)] mb-4 leading-relaxed">
          {ar
            ? 'للإدارة حق تعديل السعر أو قفله إذا رأت أنه يضر بالمنصة. التغيير يسري فورًا في صفحة الرواية والشراء، وفي الصفحة الرئيسية بعد تحديث الفهرس من الإدارة.'
            : 'The admin may adjust or lock the price if it harms the platform. Changes apply at once on the novel page and checkout, and on the home page after the admin refreshes the catalog.'}
        </p>
        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--line)]">
          <button type="button" className="outline-button small" onClick={onClose}>{ar ? 'إلغاء' : 'Cancel'}</button>
          <button type="submit" className="primary-button small" disabled={saving}>{saving ? '…' : ar ? 'حفظ' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------- earnings

export const EarningsPanel: React.FC<{ uid: string; novels: Novel[]; ar: boolean }> = ({ uid, novels, ar }) => {
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [sharePercent, setSharePercent] = useState(DEFAULT_WRITER_SHARE_PERCENT);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, settings] = await Promise.all([writerService.getMySales(uid), settingsService.getSettings()]);
        if (cancelled) return;
        setSales(list);
        if (typeof settings.writerSharePercent === 'number') setSharePercent(settings.writerSharePercent);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const sum = useMemo(() => summarizeSales(sales || []), [sales]);
  const title = (id: string) => novels.find(n => n.id === id)?.title || sales?.find(s => s.novelId === id)?.novelTitle || id;

  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-medium mb-1 flex items-center gap-2"><Wallet size={18} /> {ar ? 'أرباحي' : 'My earnings'}</h2>
      <p className="text-xs text-[var(--muted)] mb-3">
        {ar
          ? `لك ${sharePercent}% من كل عملية بيع لرواياتك أو كتبها الرقمية (بعد الخصم)، والباقي للمنصة. تُحتسب المبيعات بعد موافقة الإدارة على الطلب. التحويل لك يتم يدويًا من الإدارة.`
          : `You get ${sharePercent}% of every sale of your novels or their digital books (after discounts); the rest goes to the platform. Sales count once the admin approves the order. Payouts are made manually by the admin.`}
      </p>
      {failed ? (
        <p className="text-xs text-red-700 border border-red-200 p-3">{ar ? 'تعذر تحميل الأرباح. تأكد من نشر قواعد Firestore الجديدة.' : 'Could not load earnings. Make sure the new Firestore rules are deployed.'}</p>
      ) : sales === null ? (
        <p className="text-xs text-[var(--muted)]">…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white border border-[var(--line)] p-3"><small className="block text-[var(--muted)]">{ar ? 'عدد المبيعات' : 'Sales'}</small><b className="text-lg">{sum.count}</b></div>
            <div className="bg-white border border-[var(--line)] p-3"><small className="block text-[var(--muted)]">{ar ? 'إجمالي ما دفعه القراء' : 'Paid by readers'}</small><b className="text-lg">{money(sum.net, ar)}</b></div>
            <div className="bg-white border border-[var(--line)] p-3"><small className="block text-[var(--muted)]">{ar ? 'أرباحك' : 'Your earnings'}</small><b className="text-lg text-[var(--green)]">{money(sum.writerShare, ar)}</b></div>
          </div>
          {Object.keys(sum.byNovel).length > 0 && (
            <div className="divide-y divide-[var(--line)] border border-[var(--line)] bg-white text-sm">
              {Object.entries(sum.byNovel).map(([id, v]) => (
                <div key={id} className="flex justify-between p-3">
                  <span>{title(id)}</span>
                  <span className="text-xs text-[var(--muted)]">{v.count} {ar ? 'عملية' : 'sales'} · <b className="text-[var(--ink)]">{money(v.writerShare, ar)}</b></span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------- coupons

interface CouponForm {
  code: string;
  novelId: string;
  type: 'percent' | 'fixed';
  value: string;
  maxUses: string;
  expiresAt: string;
  active: boolean;
  isEdit: boolean;
}

export const CouponsPanel: React.FC<{ uid: string; novels: Novel[]; ar: boolean; explain: Explain }> = ({ uid, novels, ar, explain }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<CouponForm | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setCoupons(await writerService.getMyCoupons(uid));
    } catch (err) {
      setError(explain(err));
    }
  }, [uid, explain]);

  useEffect(() => {
    load();
  }, [load]);

  const publishedOrApproved = novels;
  const openNew = () =>
    setForm({ code: '', novelId: publishedOrApproved[0]?.id || '', type: 'percent', value: '20', maxUses: '0', expiresAt: '', active: true, isEdit: false });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      setError('');
      await writerService.saveCoupon(
        uid,
        {
          code: form.code,
          novelId: form.novelId,
          type: form.type,
          value: Number(form.value),
          maxUses: Number(form.maxUses) || 0,
          expiresAt: form.expiresAt || null,
          active: form.active,
        },
        form.isEdit
      );
      setForm(null);
      await load();
    } catch (err) {
      setError(explain(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Coupon) => {
    try {
      await writerService.saveCoupon(
        uid,
        { code: c.code, novelId: c.novelId || '', type: c.type, value: c.value, maxUses: c.maxUses || 0, expiresAt: c.expiresAt || null, active: !c.active },
        true
      );
      await load();
    } catch (err) {
      setError(explain(err));
    }
  };

  const remove = async (c: Coupon) => {
    if (!window.confirm(ar ? `حذف الكود ${c.code}؟` : `Delete code ${c.code}?`)) return;
    try {
      await writerService.deleteCoupon(c.code);
      await load();
    } catch (err) {
      setError(explain(err));
    }
  };

  const novelTitle = (id?: string) => novels.find(n => n.id === id)?.title || '—';

  return (
    <section className="mt-10">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-1">
        <h2 className="font-serif text-xl font-medium flex items-center gap-2"><Tag size={18} /> {ar ? 'خصومات رواياتي' : 'My novel discounts'}</h2>
        <button className="outline-button small" onClick={openNew} disabled={novels.length === 0}>{ar ? 'كود خصم جديد' : 'New discount code'}</button>
      </div>
      <p className="text-xs text-[var(--muted)] mb-3">
        {ar
          ? 'كل كود ينطبق على رواية واحدة من رواياتك فقط (روايتها أو كتابها الرقمي). الخصم يُحسب على نصيبك أنت: ربحك = نسبتك من السعر بعد الخصم.'
          : 'Each code applies to ONE of your novels only (the novel or its digital book). The discount comes out of your share: your earning = your percentage of the discounted price.'}
      </p>
      {error && <div className="mb-3 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">{error}</div>}
      {coupons.length === 0 ? (
        <p className="text-xs text-[var(--muted)] border border-[var(--line)] p-4">{ar ? 'لا توجد أكواد خصم بعد.' : 'No discount codes yet.'}</p>
      ) : (
        <div className="divide-y divide-[var(--line)] border border-[var(--line)] bg-white">
          {coupons.map(c => (
            <div key={c.code} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <b className="font-mono">{c.code}</b>
              <span className="flex-1 min-w-[160px] text-xs text-[var(--muted)]">
                {novelTitle(c.novelId)} · {c.type === 'percent' ? `${c.value}%` : `${c.value} ${ar ? 'ج.م' : 'EGP'}`} · {ar ? 'استُخدم' : 'used'} {c.usedCount || 0}{c.maxUses ? `/${c.maxUses}` : ''}
              </span>
              <button className={`px-2 py-0.5 text-[11px] ${c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`} onClick={() => toggle(c)}>
                {c.active ? (ar ? 'مفعّل' : 'Active') : (ar ? 'متوقف' : 'Paused')}
              </button>
              <button className="p-1 text-red-600" onClick={() => remove(c)} aria-label="delete"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white border border-[var(--line)] w-full max-w-md p-6 text-start shadow-xl space-y-3">
            <h3 className="font-serif text-lg font-medium">{ar ? 'كود خصم' : 'Discount code'}</h3>
            {error && <div className="p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">{error}</div>}
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? 'الكود (حروف إنجليزية وأرقام)' : 'Code (letters & digits)'}</label>
              <input className={`${inputCls} font-mono uppercase`} dir="ltr" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? 'الرواية' : 'Novel'}</label>
              <select className={inputCls} value={form.novelId} onChange={e => setForm({ ...form, novelId: e.target.value })}>
                {novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">{ar ? 'النوع' : 'Type'}</label>
                <select className={inputCls} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}>
                  <option value="percent">{ar ? 'نسبة %' : 'Percent %'}</option>
                  <option value="fixed">{ar ? 'مبلغ ثابت' : 'Fixed amount'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{ar ? 'القيمة' : 'Value'}</label>
                <input type="number" min={1} max={form.type === 'percent' ? 90 : 5000} className={inputCls} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{ar ? 'أقصى استخدام (0 = بلا حد)' : 'Max uses (0 = unlimited)'}</label>
                <input type="number" min={0} className={inputCls} value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{ar ? 'ينتهي في (اختياري)' : 'Expires (optional)'}</label>
                <input type="date" className={inputCls} value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--line)]">
              <button type="button" className="outline-button small" onClick={() => setForm(null)}>{ar ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" className="primary-button small" disabled={saving}>{saving ? '…' : ar ? 'حفظ' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------- requests to join plans

export const PlanRequestsPanel: React.FC<{ uid: string; ownerName: string; novels: Novel[]; ar: boolean; explain: Explain }> = ({
  uid,
  ownerName,
  novels,
  ar,
  explain,
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [novelId, setNovelId] = useState('');
  const [planId, setPlanId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, r] = await Promise.all([settingsService.getPlans(), writerService.getMyPlanRequests(uid)]);
      setPlans(p.filter(x => x.active !== false));
      setRequests(r);
    } catch (err) {
      setError(explain(err));
    }
  }, [uid, explain]);

  useEffect(() => {
    load();
  }, [load]);

  const eligibleNovels = novels.filter(n => n.published);
  const selectedNovel = eligibleNovels.find(n => n.id === novelId) || eligibleNovels[0];
  const choosablePlans = plans.filter(p => !p.accessAll && !(p.novelIds || []).includes(selectedNovel?.id || ''));
  const selectedPlanId = choosablePlans.some(p => p.id === planId) ? planId : choosablePlans[0]?.id || '';

  const send = async () => {
    const plan = choosablePlans.find(p => p.id === selectedPlanId);
    if (!selectedNovel || !plan) return;
    try {
      setBusy(true);
      setError('');
      await writerService.requestPlan(uid, ownerName, selectedNovel, { id: plan.id, name: plan.name });
      setNotice(ar ? 'تم إرسال الطلب للإدارة.' : 'Request sent to the admin.');
      setTimeout(() => setNotice(''), 4000);
      await load();
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (r: PlanRequest) => {
    try {
      await writerService.cancelPlanRequest(r.id);
      await load();
    } catch (err) {
      setError(explain(err));
    }
  };

  const statusLabel = (s: PlanRequest['status']) =>
    s === 'approved' ? (ar ? 'تمت الإضافة' : 'Added') : s === 'rejected' ? (ar ? 'مرفوض' : 'Rejected') : ar ? 'قيد المراجعة' : 'Pending';
  const statusCls = (s: PlanRequest['status']) =>
    s === 'approved' ? 'bg-emerald-100 text-emerald-800' : s === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900';

  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-medium mb-1 flex items-center gap-2"><Send size={18} /> {ar ? 'طلب إضافة روايتي لباقة' : 'Ask to add my novel to a plan'}</h2>
      <p className="text-xs text-[var(--muted)] mb-3">
        {ar
          ? 'الباقات تفتح للمشتركين مجموعة من الروايات. اطلب من الإدارة إضافة إحدى رواياتك المنشورة لباقة، وستوافق أو ترفض. الإضافة للباقات لا تُحتسب ضمن أرباح المبيعات حاليًا.'
          : 'Plans unlock a set of novels for subscribers. Ask the admin to add one of your published novels to a plan. Plan inclusion is not counted in sales earnings for now.'}
      </p>
      {error && <div className="mb-3 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">{error}</div>}
      {notice && <div className="mb-3 p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs">{notice}</div>}

      {eligibleNovels.length === 0 ? (
        <p className="text-xs text-[var(--muted)] border border-[var(--line)] p-4">{ar ? 'تظهر هنا رواياتك بعد اعتماد الإدارة ونشرها.' : 'Your novels appear here once the admin approves and publishes them.'}</p>
      ) : choosablePlans.length === 0 ? (
        <p className="text-xs text-[var(--muted)] border border-[var(--line)] p-4">{ar ? 'لا توجد باقات متاحة لإضافة هذه الرواية (قد تكون مضافة بالفعل).' : 'No plan is available for this novel (it may already be included).'}</p>
      ) : (
        <div className="flex flex-wrap items-end gap-3 bg-white border border-[var(--line)] p-3">
          <div className="min-w-[180px] flex-1">
            <label className="block text-xs font-medium mb-1">{ar ? 'الرواية' : 'Novel'}</label>
            <select className={inputCls} value={selectedNovel?.id || ''} onChange={e => setNovelId(e.target.value)}>
              {eligibleNovels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="block text-xs font-medium mb-1">{ar ? 'الباقة' : 'Plan'}</label>
            <select className={inputCls} value={selectedPlanId} onChange={e => setPlanId(e.target.value)}>
              {choosablePlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button className="primary-button small" disabled={busy} onClick={send}>{ar ? 'إرسال الطلب' : 'Send request'}</button>
        </div>
      )}

      {requests.length > 0 && (
        <div className="divide-y divide-[var(--line)] border border-[var(--line)] bg-white mt-3 text-sm">
          {requests.map(r => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="flex-1 min-w-[180px]">{r.novelTitle} → <b>{r.planName}</b>{r.status === 'rejected' && r.adminNote ? <small className="block text-red-700">{r.adminNote}</small> : null}</span>
              <span className={`px-2 py-0.5 text-[11px] ${statusCls(r.status)}`}>{statusLabel(r.status)}</span>
              {r.status !== 'approved' && (
                <button className="p-1 text-red-600" onClick={() => cancel(r)} aria-label="cancel"><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
