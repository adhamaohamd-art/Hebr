import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, X, Lock, Unlock, Save, ChevronDown, ChevronUp } from 'lucide-react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LoadingState } from '../../components/States';
import { useLanguage } from '../../context/LanguageContext';
import { settingsService } from '../../services/settingsService';
import { planRequestAdmin } from '../../services/writerService';
import { novelService } from '../../services/novelService';
import { computeWriterLimit } from '../../lib/writer';
import { summarizeSales } from '../../lib/earnings';
import { releaseStatus, formatWait } from '../../lib/releaseSchedule';
import { clientCache } from '../../lib/cache';
import { Novel, Plan, PlanRequest, Sale, UserProfile } from '../../types';

interface WriterRow {
  profile: UserProfile;
  limit: number;
  source: string;
  novelCount: number;
  novels: Novel[];
  salesCount: number;
  earned: number;
  platform: number;
}

function toMs(v: unknown): number {
  const x = v as { toMillis?: () => number } | number | null | undefined;
  if (typeof x === 'number') return x;
  return x?.toMillis?.() ?? 0;
}

export const AdminWritersPage: React.FC = () => {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rows, setRows] = useState<WriterRow[]>([]);
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, { novelPrice: string; bookPrice: string }>>({});
  const [rejecting, setRejecting] = useState<PlanRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [busy, setBusy] = useState(false);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const allPlans = await settingsService.getPlans();
      setPlans(allPlans);
      const writerPlanIds = allPlans.filter(p => (p.writerNovelLimit ?? 0) > 0).map(p => p.id);

      // A writer is anyone with: an admin-granted limit, an active writer-plan subscription, or novels of their own.
      const profiles = new Map<string, UserProfile>();
      const addUsers = (snap: { forEach: (cb: (d: { id: string; data: () => unknown }) => void) => void }) =>
        snap.forEach(d => profiles.set(d.id, { uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));

      addUsers(await getDocs(query(collection(db, 'users'), where('writerLimit', '>', 0))));
      for (let i = 0; i < writerPlanIds.length; i += 30) {
        addUsers(
          await getDocs(query(collection(db, 'users'), where('subscription.planId', 'in', writerPlanIds.slice(i, i + 30))))
        );
      }

      const novelsSnap = await getDocs(query(collection(db, 'novels'), where('ownerId', '>', '')));
      const novelsByOwner = new Map<string, Novel[]>();
      novelsSnap.forEach(d => {
        const n = { id: d.id, ...(d.data() as Omit<Novel, 'id'>) };
        if (!n.ownerId) return;
        novelsByOwner.set(n.ownerId, [...(novelsByOwner.get(n.ownerId) || []), n]);
      });
      // Owners we have not loaded yet (e.g. subscription expired, no admin grant)
      for (const ownerId of novelsByOwner.keys()) {
        if (profiles.has(ownerId)) continue;
        const u = await getDoc(doc(db, 'users', ownerId));
        if (u.exists()) profiles.set(ownerId, { uid: ownerId, ...(u.data() as Omit<UserProfile, 'uid'>) });
      }

      const salesSnap = await getDocs(collection(db, 'sales'));
      const salesByOwner = new Map<string, Sale[]>();
      salesSnap.forEach(d => {
        const s = { id: d.id, ...(d.data() as Omit<Sale, 'id'>) };
        salesByOwner.set(s.ownerId, [...(salesByOwner.get(s.ownerId) || []), s]);
      });

      const planById = new Map(allPlans.map(p => [p.id, p]));
      const list: WriterRow[] = [];
      for (const [uid, profile] of profiles) {
        const plan = profile.subscription ? planById.get(profile.subscription.planId) || null : null;
        const limit = computeWriterLimit(profile, plan);
        const novels = (novelsByOwner.get(uid) || []).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        const sums = summarizeSales(salesByOwner.get(uid) || []);
        const planPart = limit > 0 && (profile.writerLimit ?? 0) < limit ? plan?.name || profile.subscription?.planName || '' : '';
        const source = (profile.writerLimit ?? 0) > 0 && !planPart
          ? ar ? 'منحة من الأدمن' : 'Admin grant'
          : planPart
          ? `${ar ? 'باقة' : 'Plan'}: ${planPart}`
          : ar ? 'اشتراك منتهٍ' : 'Subscription ended';
        list.push({
          profile,
          limit,
          source,
          novelCount: novels.length,
          novels,
          salesCount: sums.count,
          earned: sums.writerShare,
          platform: Math.round((sums.net - sums.writerShare) * 100) / 100,
        });
      }
      list.sort((a, b) => b.earned - a.earned || b.novelCount - a.novelCount);
      setRows(list);
      setRequests(await planRequestAdmin.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
  const totals = useMemo(
    () => ({
      writers: rows.length,
      novels: rows.reduce((s, r) => s + r.novelCount, 0),
      earned: rows.reduce((s, r) => s + r.earned, 0),
      platform: rows.reduce((s, r) => s + r.platform, 0),
    }),
    [rows]
  );

  const savePrice = async (n: Novel) => {
    const d = priceDraft[n.id];
    if (!d) return;
    try {
      setBusy(true);
      const novelPrice = Math.max(0, Number(d.novelPrice) || 0);
      const bookPrice = d.bookPrice.trim() === '' ? null : Math.max(0, Number(d.bookPrice) || 0);
      await writeBatch(db)
        .update(doc(db, 'novels', n.id), { novelPrice, bookPrice, updatedAt: serverTimestamp() })
        .commit();
      clientCache.invalidate(`novel_${n.id}`);
      flash(ar ? 'تم تعديل السعر. اضغط «إعادة بناء الفهرس» ليظهر في الصفحة الرئيسية.' : 'Price updated. Rebuild the catalog to refresh the home page.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const togglePriceLock = async (n: Novel) => {
    try {
      setBusy(true);
      await writeBatch(db)
        .update(doc(db, 'novels', n.id), { priceLocked: !n.priceLocked, updatedAt: serverTimestamp() })
        .commit();
      clientCache.invalidate(`novel_${n.id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const approveRequest = async (r: PlanRequest) => {
    try {
      setBusy(true);
      await planRequestAdmin.approve(r);
      flash(ar ? `أُضيفت «${r.novelTitle}» إلى باقة ${r.planName}.` : `Added “${r.novelTitle}” to plan ${r.planName}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    try {
      setBusy(true);
      await planRequestAdmin.reject(rejecting, rejectNote);
      setRejecting(null);
      setRejectNote('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const rebuildCatalog = async () => {
    try {
      setBusy(true);
      const res = await novelService.rebuildCatalogAndSummaries();
      flash(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState message={ar ? 'جاري تحميل الكتّاب…' : 'Loading writers…'} />;

  const money = (n: number) => `${Math.round(n * 100) / 100} ${ar ? 'ج.م' : 'EGP'}`;
  const inputCls = 'p-1.5 border border-[var(--line)] text-xs bg-white w-24';

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-medium">{ar ? 'الكتّاب' : 'Writers'}</h2>
          <p className="text-xs text-[var(--muted)]">
            {ar
              ? 'كل من يملك حساب كاتب (منحة من الأدمن أو باقة «فريق حبر»)، مع رواياتهم وأرباحهم وطلباتهم.'
              : 'Everyone with a writer account (admin grant or a writer plan), with their novels, earnings and requests.'}
          </p>
        </div>
        <button className="outline-button small" onClick={rebuildCatalog} disabled={busy}>
          {ar ? 'إعادة بناء الفهرس' : 'Rebuild catalog'}
        </button>
      </div>

      {notice && <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs">{notice}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          [ar ? 'الكتّاب' : 'Writers', String(totals.writers)],
          [ar ? 'رواياتهم' : 'Their novels', String(totals.novels)],
          [ar ? 'مستحق للكتّاب' : 'Owed to writers', money(totals.earned)],
          [ar ? 'نصيب المنصة' : 'Platform share', money(totals.platform)],
        ].map(([label, value]) => (
          <div key={label} className="bg-white border border-[var(--line)] p-3">
            <small className="text-[var(--muted)] block">{label}</small>
            <b className="text-lg">{value}</b>
          </div>
        ))}
      </div>

      {/* ------------- Requests to join plans ------------- */}
      <section className="mb-8">
        <h3 className="font-serif text-lg font-medium mb-2">
          {ar ? 'طلبات إضافة روايات للباقات' : 'Requests to add novels to plans'}{' '}
          {pending.length > 0 && <span className="px-2 py-0.5 text-[11px] bg-amber-100 text-amber-900">{pending.length}</span>}
        </h3>
        {pending.length === 0 ? (
          <p className="text-xs text-[var(--muted)] border border-[var(--line)] p-4">{ar ? 'لا توجد طلبات معلقة.' : 'No pending requests.'}</p>
        ) : (
          <div className="space-y-2">
            {pending.map(r => (
              <div key={r.id} className="bg-white border border-[var(--line)] p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px] text-sm">
                  <b>{r.novelTitle}</b>
                  <small className="block text-[var(--muted)]">
                    {ar ? 'الكاتب: ' : 'Writer: '}{r.ownerName || r.ownerId} · {ar ? 'الباقة: ' : 'Plan: '}{r.planName}
                  </small>
                </div>
                <button className="primary-button small" disabled={busy} onClick={() => approveRequest(r)}>
                  <Check size={14} /> {ar ? 'موافقة وإضافة' : 'Approve & add'}
                </button>
                <button className="outline-button small" disabled={busy} onClick={() => setRejecting(r)}>
                  <X size={14} /> {ar ? 'رفض' : 'Reject'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------- Writers ------------- */}
      <section>
        <h3 className="font-serif text-lg font-medium mb-2">{ar ? 'قائمة الكتّاب' : 'Writers list'}</h3>
        {rows.length === 0 ? (
          <p className="text-xs text-[var(--muted)] border border-[var(--line)] p-4">{ar ? 'لا يوجد كتّاب بعد.' : 'No writers yet.'}</p>
        ) : (
          <div className="space-y-2">
            {rows.map(r => {
              const isOpen = open === r.profile.uid;
              return (
                <div key={r.profile.uid} className="bg-white border border-[var(--line)]">
                  <button
                    className="w-full p-3 flex flex-wrap items-center gap-4 text-start"
                    onClick={() => setOpen(isOpen ? null : r.profile.uid)}
                  >
                    <div className="flex-1 min-w-[200px]">
                      <b>{r.profile.name}</b>
                      <small className="block text-[var(--muted)]">{r.profile.email}</small>
                    </div>
                    <div className="text-xs text-[var(--muted)]">{r.source}</div>
                    <div className="text-xs">
                      {ar ? 'الروايات' : 'Novels'}: <b>{r.novelCount}</b> / {r.limit}
                    </div>
                    <div className="text-xs">
                      {ar ? 'مبيعات' : 'Sales'}: <b>{r.salesCount}</b>
                    </div>
                    <div className="text-xs">
                      {ar ? 'أرباحه' : 'Earned'}: <b>{money(r.earned)}</b>
                    </div>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-[var(--line)] p-3 space-y-3">
                      {r.novels.length === 0 && <p className="text-xs text-[var(--muted)]">{ar ? 'لم ينشئ روايات بعد.' : 'No novels yet.'}</p>}
                      {r.novels.map(n => {
                        const st = releaseStatus(n.releaseCount, toMs(n.lastReleaseAt));
                        const d = priceDraft[n.id] || { novelPrice: String(n.novelPrice ?? 0), bookPrice: n.bookPrice == null ? '' : String(n.bookPrice) };
                        return (
                          <div key={n.id} className="border border-[var(--line)] p-3">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <b className="text-sm">{n.title}</b>
                              <span className={`px-2 py-0.5 text-[11px] ${n.published ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                                {n.published ? (ar ? 'منشورة' : 'Published') : n.reviewStatus === 'pending' ? (ar ? 'بانتظار المراجعة' : 'Pending review') : (ar ? 'غير منشورة' : 'Unpublished')}
                              </span>
                              <small className="text-[var(--muted)]">
                                {n.chaptersCount || 0} {ar ? 'فصل' : 'ch.'} ·{' '}
                                {st.canRelease
                                  ? ar ? 'يستطيع نشر فصل الآن' : 'can release a chapter now'
                                  : `${ar ? 'النشر التالي بعد ' : 'next release in '}${formatWait(st.waitMs, ar)}`}
                              </small>
                              {n.isFreeNovel && <span className="px-2 py-0.5 text-[11px] bg-blue-100 text-blue-800">{ar ? 'مجانية بالكامل' : 'Fully free'}</span>}
                              {!n.isFreeNovel && (n.freeChapters || 0) > 0 && (
                                <small className="text-[var(--muted)]">{ar ? `${n.freeChapters} فصول مجانية` : `${n.freeChapters} free chapters`}</small>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <label>
                                {ar ? 'سعر الرواية' : 'Novel price'}{' '}
                                <input type="number" min={0} className={inputCls} value={d.novelPrice}
                                  onChange={e => setPriceDraft({ ...priceDraft, [n.id]: { ...d, novelPrice: e.target.value } })} />
                              </label>
                              <label>
                                {ar ? 'سعر الكتاب' : 'Book price'}{' '}
                                <input type="number" min={0} className={inputCls} value={d.bookPrice}
                                  onChange={e => setPriceDraft({ ...priceDraft, [n.id]: { ...d, bookPrice: e.target.value } })} />
                              </label>
                              <button className="outline-button small" disabled={busy || !priceDraft[n.id]} onClick={() => savePrice(n)}>
                                <Save size={13} /> {ar ? 'حفظ السعر' : 'Save price'}
                              </button>
                              <button className="outline-button small" disabled={busy} onClick={() => togglePriceLock(n)}
                                title={ar ? 'عند القفل لا يستطيع الكاتب تغيير سعر هذه الرواية' : 'When locked the writer cannot change this novel’s price'}>
                                {n.priceLocked ? <><Lock size={13} /> {ar ? 'السعر مقفول — افتح' : 'Price locked — unlock'}</> : <><Unlock size={13} /> {ar ? 'قفل السعر' : 'Lock price'}</>}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <p className="text-[11px] text-[var(--muted)]">
                        {ar
                          ? `نصيب المنصة من مبيعاته: ${money(r.platform)}. الدفع للكاتب يتم يدويًا خارج الموقع.`
                          : `Platform share of their sales: ${money(r.platform)}. Payouts to the writer are made manually.`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-[var(--muted)] mt-3">
          {ar ? `الباقات المتاحة للضم: ${plans.filter(p => p.active !== false && !p.accessAll).map(p => p.name).join('، ') || '—'}` : ''}
        </p>
      </section>

      {rejecting && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--line)] max-w-md w-full p-6 text-start shadow-xl">
            <h3 className="font-serif text-lg font-medium mb-2">{ar ? 'رفض الطلب' : 'Reject request'}</h3>
            <p className="text-xs text-[var(--muted)] mb-3">{rejecting.novelTitle} → {rejecting.planName}</p>
            <textarea className="w-full p-2 border border-[var(--line)] text-xs mb-4" rows={3} maxLength={200}
              placeholder={ar ? 'سبب الرفض (يظهر للكاتب)' : 'Reason (shown to the writer)'}
              value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
            <div className="flex justify-end gap-3">
              <button className="outline-button small" onClick={() => setRejecting(null)}>{ar ? 'إلغاء' : 'Cancel'}</button>
              <button className="primary-button small" disabled={busy} onClick={confirmReject}>{ar ? 'تأكيد الرفض' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
