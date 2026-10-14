import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, Tag } from 'lucide-react';
import { LoadingState } from '../../components/States';
import { settingsService } from '../../services/settingsService';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedPlan } from '../../i18n/translations';
import { Plan, Coupon } from '../../types';
import { LIMITS } from '../../config';

export const AdminPlansCouponsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // New coupon form
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponValue, setCouponValue] = useState<number>(20);
  const [couponMaxUses, setCouponMaxUses] = useState<number>(100);

  // Edit plan state
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pList, cList] = await Promise.all([
        settingsService.getPlans(),
        settingsService.getCoupons(),
      ]);
      setPlans(pList);
      setCoupons(cList);
    } catch (e) {
      console.warn('Error loading plans/coupons:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      await settingsService.saveCoupon({
        code: couponCode.trim().toUpperCase(),
        type: couponType,
        value: Number(couponValue),
        active: true,
        expiresAt: null,
        maxUses: Number(couponMaxUses),
        usedCount: 0,
      });
      setCouponCode('');
      setNotice({ type: 'success', msg: t.common.success });
      setTimeout(() => setNotice(null), 3000);
      await fetchData();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      setNotice({ type: 'error', msg: t.common.error });
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    const confirmMsg = t.adminPlansCoupons.confirmDeleteCoupon.replace('{code}', code);
    if (!window.confirm(confirmMsg)) return;
    try {
      await settingsService.deleteCoupon(code);
      setNotice({ type: 'success', msg: t.common.success });
      setTimeout(() => setNotice(null), 3000);
      await fetchData();
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      setNotice({ type: 'error', msg: t.common.error });
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editingPlan.name) return;

    try {
      await settingsService.savePlan(editingPlan, editingPlan.id);
      setEditingPlan(null);
      setNotice({ type: 'success', msg: t.common.success });
      setTimeout(() => setNotice(null), 3000);
      await fetchData();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      setNotice({ type: 'error', msg: t.common.error });
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    const confirmMsg = t.adminPlansCoupons.confirmDeletePlan.replace('{name}', name);
    if (!window.confirm(confirmMsg)) return;
    try {
      await settingsService.deletePlan(id);
      setNotice({ type: 'success', msg: t.common.success });
      setTimeout(() => setNotice(null), 3000);
      await fetchData();
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      setNotice({ type: 'error', msg: t.common.error });
    }
  };

  if (loading) {
    return <LoadingState message={t.common.loading} />;
  }

  return (
    <div className="space-y-10">
      {notice && (
        <div
          className={`p-3 border text-xs flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          <span>{notice.msg}</span>
          <button onClick={() => setNotice(null)} className="underline text-xs">
            {t.common.close}
          </button>
        </div>
      )}

      {/* Plans Section */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl font-medium">{t.adminPlansCoupons.pageTitle}</h2>
            <p className="text-xs text-[var(--muted)]">{t.adminPlansCoupons.pageSubtitle}</p>
          </div>
          <button
            className="primary-button small"
            onClick={() =>
              setEditingPlan({
                name: '',
                priceMonthly: 49,
                priceYearly: 490,
                description: '',
                active: true,
                books: language === 'ar' ? ['وصول شامل لجميع الروايات'] : ['Full access to all novels'],
                featured: false,
              })
            }
          >
            <Plus size={15} /> {t.adminPlansCoupons.addNewPlanBtn}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const localized = getLocalizedPlan(plan, language);
            return (
              <div
                key={plan.id}
                className={`p-6 border bg-white flex flex-col justify-between ${
                  plan.featured ? 'border-[var(--green)] ring-1 ring-[var(--green)]' : 'border-[var(--line)]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-serif text-xl font-medium">{localized.name}</span>
                    {plan.featured && (
                      <span className="text-[10px] bg-[var(--bronze)] text-white px-2 py-0.5">
                        {t.adminPlansCoupons.mostChosen}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-serif text-[var(--green)] my-3">
                    {plan.priceMonthly} {t.common.currency} <small className="text-xs text-[var(--muted)]">{t.adminPlansCoupons.perMonth}</small>
                    <div className="text-xs text-[var(--muted)] font-sans">
                      {plan.priceYearly} {t.common.currency} {t.adminPlansCoupons.perYear}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-4">{localized.description}</p>
                  <div className="space-y-1 mb-6 text-xs">
                    {localized.books?.map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-stone-700">
                        <Check size={13} className="text-[var(--bronze)] flex-shrink-0" /> {b}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[var(--line)]">
                  <button
                    onClick={() => setEditingPlan(plan)}
                    className="p-1 hover:text-[var(--green)] text-xs flex items-center gap-1"
                  >
                    <Edit2 size={13} /> {t.common.edit}
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id, localized.name)}
                    className="p-1 text-red-600 hover:text-red-800 text-xs flex items-center gap-1"
                  >
                    <Trash2 size={13} /> {t.common.delete}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coupons Section */}
      <div className="pt-8 border-t border-[var(--line)]">
        <div className="mb-6">
          <h2 className="font-serif text-2xl font-medium">{t.adminPlansCoupons.couponsTitle}</h2>
          <p className="text-xs text-[var(--muted)]">{t.adminPlansCoupons.pageSubtitle}</p>
        </div>

        {/* Add Coupon Form */}
        <form
          onSubmit={handleCreateCoupon}
          className="p-4 bg-white border border-[var(--line)] mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t.adminPlansCoupons.colCode}</label>
            <input
              type="text"
              required
              value={couponCode}
              maxLength={LIMITS.couponCodeMax}
              onChange={e => setCouponCode(e.target.value)}
              placeholder={t.adminPlansCoupons.couponPlaceholder}
              className="w-full p-2 border border-[var(--line)] text-xs uppercase font-mono"
            />
            <span className="text-[10px] text-[var(--muted)] block text-end mt-0.5">
              {couponCode.length} / {LIMITS.couponCodeMax}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">{t.adminPlansCoupons.typeLabel}</label>
            <select
              value={couponType}
              onChange={e => setCouponType(e.target.value as 'percent' | 'fixed')}
              className="w-full p-2 border border-[var(--line)] text-xs bg-white"
            >
              <option value="percent">{t.adminPlansCoupons.typePercent}</option>
              <option value="fixed">{t.adminPlansCoupons.typeFixed}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">{t.adminPlansCoupons.valueLabel}</label>
            <input
              type="number"
              min="1"
              required
              value={couponValue}
              onChange={e => setCouponValue(Number(e.target.value))}
              className="w-full p-2 border border-[var(--line)] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">{t.adminPlansCoupons.maxUsesLabel}</label>
            <input
              type="number"
              min="1"
              required
              value={couponMaxUses}
              onChange={e => setCouponMaxUses(Number(e.target.value))}
              className="w-full p-2 border border-[var(--line)] text-xs"
            />
          </div>

          <div>
            <button type="submit" className="primary-button small w-full">
              <Tag size={14} /> {t.adminPlansCoupons.createCouponBtn}
            </button>
          </div>
        </form>

        {/* Coupons Table */}
        <div className="admin-panel table-panel">
          <table>
            <thead>
              <tr>
                <th>{t.adminPlansCoupons.colCode}</th>
                <th>{t.adminPlansCoupons.colDiscount}</th>
                <th>{t.adminPlansCoupons.colUses}</th>
                <th>{t.adminPlansCoupons.colStatus}</th>
                <th>{t.adminPlansCoupons.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.code}>
                  <td>
                    <b className="font-mono text-emerald-800 tracking-wider">{c.code}</b>
                  </td>
                  <td>
                    {c.value} {c.type === 'percent' ? '%' : t.common.currency}
                  </td>
                  <td>
                    {c.usedCount || 0} / {c.maxUses || t.adminPlansCoupons.unlimited}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold ${
                        c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {c.active ? t.adminPlansCoupons.active : t.adminPlansCoupons.inactive}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteCoupon(c.code)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      {t.common.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-lg w-full text-start border border-[var(--line)] shadow-xl">
            <h3 className="font-serif text-xl font-medium mb-4">
              {editingPlan.id ? t.adminPlansCoupons.editPlanTitle : t.adminPlansCoupons.addPlanTitle}
            </h3>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">{t.adminPlansCoupons.planName}</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full p-2 border border-[var(--line)] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminPlansCoupons.priceMonthly}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingPlan.priceMonthly ?? 45}
                    onChange={e =>
                      setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-[var(--line)] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminPlansCoupons.priceYearly}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingPlan.priceYearly ?? 450}
                    onChange={e =>
                      setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-[var(--line)] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t.adminPlansCoupons.planDesc}</label>
                <textarea
                  rows={2}
                  value={editingPlan.description || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full p-2 border border-[var(--line)] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t.adminPlansCoupons.featuresLabel}</label>
                <input
                  type="text"
                  value={editingPlan.books?.join(language === 'ar' ? '، ' : ', ') || ''}
                  onChange={e =>
                    setEditingPlan({
                      ...editingPlan,
                      books: e.target.value.split(/[,،]/).map(s => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full p-2 border border-[var(--line)] text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredPlan"
                  checked={editingPlan.featured ?? false}
                  onChange={e => setEditingPlan({ ...editingPlan, featured: e.target.checked })}
                />
                <label htmlFor="featuredPlan" className="text-xs cursor-pointer">
                  {t.adminPlansCoupons.featureCheckLabel}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
                <button
                  type="button"
                  className="outline-button small"
                  onClick={() => setEditingPlan(null)}
                >
                  {t.common.cancel}
                </button>
                <button type="submit" className="primary-button small">
                  {t.adminPlansCoupons.savePlan}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
