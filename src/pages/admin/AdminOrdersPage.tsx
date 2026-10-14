import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  X,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { LoadingState } from '../../components/States';
import { orderService } from '../../services/orderService';
import { useLanguage } from '../../context/LanguageContext';
import { Order } from '../../types';

export const AdminOrdersPage: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const list = await orderService.getOrders();
      setOrders(list);
    } catch (err) {
      console.warn('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const duplicateRefs = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach(o => {
      if (o.transactionRef) {
        const norm = o.transactionRef.trim().toLowerCase();
        counts.set(norm, (counts.get(norm) || 0) + 1);
      }
    });
    const dupes = new Set<string>();
    counts.forEach((count, key) => {
      if (count > 1) dupes.add(key);
    });
    return dupes;
  }, [orders]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleApprove = async (order: Order) => {
    try {
      setProcessing(true);
      await orderService.approveOrder(
        order,
        reviewNote || (t.admin.orderApprovedToast + ' ' + order.userEmail)
      );
      setActionOrder(null);
      setReviewNote('');
      setNotice({ type: 'success', msg: `${t.admin.orderApprovedToast} ${order.userEmail}` });
      setTimeout(() => setNotice(null), 3500);
      await fetchOrders();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      setNotice({ type: 'error', msg: t.common.error });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (order: Order) => {
    try {
      setProcessing(true);
      await orderService.rejectOrder(
        order.id,
        reviewNote || t.admin.orderRejectedToast
      );
      setActionOrder(null);
      setReviewNote('');
      setNotice({ type: 'success', msg: t.admin.orderRejectedToast });
      setTimeout(() => setNotice(null), 3500);
      await fetchOrders();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      setNotice({ type: 'error', msg: t.common.error });
    } finally {
      setProcessing(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  if (loading) {
    return <LoadingState message={t.common.loading} />;
  }

  const filterOptions = [
    { key: 'all', label: t.adminOrders.filterAll },
    { key: 'pending', label: t.adminOrders.filterPending },
    { key: 'approved', label: t.adminOrders.filterApproved },
    { key: 'rejected', label: t.adminOrders.filterRejected },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-medium">{t.adminOrders.pageTitle}</h2>
          <p className="text-xs text-[var(--muted)]">{t.adminOrders.pageSubtitle}</p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map(opt => (
            <button
              key={opt.key}
              className={`px-3 py-1.5 text-xs border ${
                filterStatus === opt.key
                  ? 'bg-[var(--green)] text-white border-[var(--green)] font-medium'
                  : 'border-[var(--line)] bg-white text-[var(--muted)] hover:border-black'
              }`}
              onClick={() => setFilterStatus(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div
          className={`mb-4 p-3 border text-xs flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check size={16} /> {notice.msg}
          </div>
          <button onClick={() => setNotice(null)} className="underline text-xs">
            {t.common.close}
          </button>
        </div>
      )}

      <div className="admin-panel table-panel">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--muted)]">
            {t.adminOrders.noOrdersFound}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t.adminOrders.colOrderNum}</th>
                <th>{t.adminOrders.colUser}</th>
                <th>{t.adminOrders.colItems}</th>
                <th>{t.adminOrders.colMethod}</th>
                <th>{t.adminOrders.colSenderPhone}</th>
                <th>{t.adminOrders.colTransactionRef}</th>
                <th>{t.adminOrders.colTotal}</th>
                <th>{t.adminOrders.colNote}</th>
                <th>{t.adminOrders.colStatus}</th>
                <th>{t.adminOrders.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const statusBadge = {
                  pending: {
                    text: t.library.statusPending,
                    icon: Clock,
                    className: 'bg-amber-100 text-amber-800',
                  },
                  approved: {
                    text: t.library.statusApproved,
                    icon: CheckCircle2,
                    className: 'bg-emerald-100 text-emerald-800',
                  },
                  rejected: {
                    text: t.library.statusRejected,
                    icon: XCircle,
                    className: 'bg-red-100 text-red-800',
                  },
                }[order.status];

                const StatusIcon = statusBadge.icon;
                const isDupeRef = Boolean(
                  order.transactionRef &&
                  duplicateRefs.has(order.transactionRef.trim().toLowerCase())
                );

                return (
                  <tr key={order.id}>
                    <td>
                      <b>#{order.id.slice(-6).toUpperCase()}</b>
                    </td>
                    <td>
                      <div>
                        <b>{order.userName || order.userEmail.split('@')[0]}</b>
                        <small className="block text-[var(--muted)]">{order.userEmail}</small>
                      </div>
                    </td>
                    <td>
                      <div
                        className="max-w-[180px] truncate"
                        title={order.items.map(i => i.title).join(', ')}
                      >
                        {order.items.map(i => i.title).join(' + ')}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs">
                        {order.paymentMethod === 'vodafone_cash'
                          ? t.checkout.vodafoneCashTitle
                          : t.checkout.instapayTitle}
                      </span>
                    </td>
                    <td>
                      {order.senderPhone ? (
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span>{order.senderPhone}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.senderPhone!, `phone_${order.id}`)}
                            title={t.adminOrders.copyBtn}
                            className="p-1 hover:text-[var(--green)]"
                          >
                            <Copy size={12} />
                          </button>
                          {copiedKey === `phone_${order.id}` && (
                            <span className="text-[10px] text-emerald-700">✓</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">—</span>
                      )}
                    </td>
                    <td>
                      {order.transactionRef ? (
                        <div>
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <span className="font-semibold">{order.transactionRef}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(order.transactionRef!, `ref_${order.id}`)}
                              title={t.adminOrders.copyBtn}
                              className="p-1 hover:text-[var(--green)]"
                            >
                              <Copy size={12} />
                            </button>
                            {copiedKey === `ref_${order.id}` && (
                              <span className="text-[10px] text-emerald-700">✓</span>
                            )}
                          </div>
                          {isDupeRef && (
                            <div className="text-[10px] text-red-600 flex items-center gap-1 font-sans mt-0.5" title={t.adminOrders.duplicateRefWarning}>
                              <AlertTriangle size={11} />
                              <span>{t.adminOrders.duplicateRefWarning}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">—</span>
                      )}
                    </td>
                    <td>
                      <b>{order.total} {t.common.currency}</b>
                      {order.couponCode && (
                        <small className="block text-emerald-700 font-mono">
                          {t.library.couponLabel}: {order.couponCode}
                        </small>
                      )}
                    </td>
                    <td>
                      {order.note ? (
                        <span className="text-xs text-[var(--muted)] line-clamp-1" title={order.note}>
                          {order.note}
                        </span>
                      ) : order.receiptUrl ? (
                        <button
                          onClick={() => setSelectedReceipt(order.receiptUrl || null)}
                          className="text-xs text-[var(--bronze)] hover:underline flex items-center gap-1"
                        >
                          <Eye size={13} /> {t.adminOrders.viewReceipt}
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold ${statusBadge.className}`}
                      >
                        <StatusIcon size={12} /> {statusBadge.text}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {order.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setActionOrder(order);
                              setReviewNote('');
                            }}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1"
                            title={t.adminOrders.approveBtn}
                          >
                            <Check size={13} /> {t.adminOrders.approveBtn}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActionOrder(order);
                              setReviewNote(order.adminNote || '');
                            }}
                            className="text-xs text-[var(--muted)] hover:underline"
                          >
                            {order.adminNote ? `ملاحظة: ${order.adminNote}` : 'تفاصيل'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Action / Review Modal */}
      {actionOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 max-w-md w-full border border-[var(--line)] shadow-lg space-y-4 text-start">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
              <h3 className="font-serif text-lg font-medium">
                {t.adminOrders.reviewModalTitle} #{actionOrder.id.slice(-6).toUpperCase()}
              </h3>
              <button
                onClick={() => setActionOrder(null)}
                className="text-stone-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs space-y-1.5 p-3 bg-stone-50 border border-stone-200">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">{t.adminOrders.colUser}:</span>
                <b>{actionOrder.userName} ({actionOrder.userEmail})</b>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">{t.adminOrders.colTotal}:</span>
                <b className="text-[var(--green)]">{actionOrder.total} {t.common.currency}</b>
              </div>
              {actionOrder.senderPhone && (
                <div className="flex justify-between font-mono">
                  <span className="text-[var(--muted)]">{t.adminOrders.colSenderPhone}:</span>
                  <b>{actionOrder.senderPhone}</b>
                </div>
              )}
              {actionOrder.transactionRef && (
                <div className="flex justify-between font-mono">
                  <span className="text-[var(--muted)]">{t.adminOrders.colTransactionRef}:</span>
                  <b>{actionOrder.transactionRef}</b>
                </div>
              )}
              {actionOrder.note && (
                <div>
                  <span className="text-[var(--muted)] block">{t.adminOrders.colNote}:</span>
                  <span className="text-[var(--ink)]">{actionOrder.note}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                {t.adminOrders.adminNoteLabel}
              </label>
              <input
                type="text"
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="ملاحظة تظهر للمستخدم في مكتبته..."
                className="w-full p-2 border border-[var(--line)] text-xs"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                disabled={processing}
                onClick={() => handleReject(actionOrder)}
                className="px-3 py-1.5 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs"
              >
                {t.adminOrders.rejectBtn}
              </button>
              <button
                disabled={processing}
                onClick={() => handleApprove(actionOrder)}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium flex items-center gap-1.5"
              >
                <Check size={14} /> {t.adminOrders.confirmApprove}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Receipt Modal (for older orders) */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 max-w-xl w-full border border-[var(--line)] shadow-xl relative">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--line)]">
              <h4 className="font-serif text-sm font-medium">{t.adminOrders.receiptModalTitle}</h4>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 hover:bg-stone-100"
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={selectedReceipt}
              alt={t.adminOrders.receiptModalTitle}
              className="max-h-[70vh] mx-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
