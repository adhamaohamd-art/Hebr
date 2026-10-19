import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { Cover } from '../../components/Cover';
import { LoadingState } from '../../components/States';
import { novelService } from '../../services/novelService';
import { orderService } from '../../services/orderService';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedNovelField } from '../../i18n/translations';
import { getLocalizedGenres } from '../../lib/genres';
import { useGenres } from '../../context/GenresContext';
import { Novel, Order } from '../../types';

export const AdminOverviewPage: React.FC = () => {
  const { t, language, rtl } = useLanguage();
  useGenres(); // re-render when admin-added genres finish loading
  const [novels, setNovels] = useState<Novel[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const ArrowIcon = rtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const [nList, oList] = await Promise.all([
          novelService.getNovels(),
          orderService.getOrders(),
        ]);
        setNovels(nList);
        setOrders(oList);
      } catch (err) {
        console.warn('Error loading admin overview stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const approvedOrders = orders.filter(o => o.status === 'approved');
  const totalSales = approvedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const handleApprove = async (order: Order) => {
    await orderService.approveOrder(order);
    setActionMsg(`${t.admin.orderApprovedToast} ${order.userEmail}`);
    setOrders(prev =>
      prev.map(o => (o.id === order.id ? { ...o, status: 'approved' } : o))
    );
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleReject = async (orderId: string) => {
    await orderService.rejectOrder(orderId);
    setActionMsg(t.admin.orderRejectedToast);
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'rejected' } : o))
    );
    setTimeout(() => setActionMsg(''), 4000);
  };

  if (loading) {
    return <LoadingState message={t.common.loading} />;
  }

  return (
    <div>
      {actionMsg && (
        <div className="mb-6 p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs flex items-center gap-2">
          <Check size={16} /> {actionMsg}
        </div>
      )}

      {/* Real Stats Cards */}
      <div className="admin-stats">
        <div>
          <span>{t.admin.statsTotalNovels}</span>
          <b>{novels.length}</b>
          <small className="up">{t.admin.statsTotalNovelsNote}</small>
        </div>
        <div>
          <span>{t.admin.statsPendingOrders}</span>
          <b style={{ color: pendingOrders.length > 0 ? '#b06b2a' : undefined }}>
            {pendingOrders.length}
          </b>
          <small className={pendingOrders.length > 0 ? 'warn' : 'up'}>
            {pendingOrders.length > 0
              ? t.admin.statsPendingOrdersNeedsReview
              : t.admin.statsPendingOrdersCleared}
          </small>
        </div>
        <div>
          <span>{t.admin.statsTotalSales}</span>
          <b>{totalSales} {t.common.currency}</b>
          <small className="up">
            {approvedOrders.length} {t.admin.statsTotalSalesNote}
          </small>
        </div>
        <div>
          <span>{t.admin.statsTotalChapters}</span>
          <b>{novels.reduce((sum, n) => sum + (n.chaptersCount || 0), 0)}</b>
          <small className="up">{t.admin.statsTotalChaptersNote}</small>
        </div>
      </div>

      <div className="admin-grid">
        {/* Pending Orders Panel */}
        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{t.admin.recentPendingOrdersEyebrow}</span>
              <h2>{t.admin.recentPendingOrdersTitle}</h2>
            </div>
            <Link to="/admin/orders" className="text-button">
              {t.admin.viewAllOrdersBtn} <ArrowIcon size={14} />
            </Link>
          </div>

          {pendingOrders.length === 0 ? (
            <p className="text-xs text-[var(--muted)] text-center py-8">
              {t.admin.noPendingOrders}
            </p>
          ) : (
            <div className="space-y-3">
              {pendingOrders.slice(0, 5).map(o => (
                <div key={o.id} className="order-row flex justify-between items-center text-start">
                  <div className="flex items-center gap-3">
                    <span className="order-avatar">{o.userName?.[0] || o.userEmail[0]}</span>
                    <div>
                      <b>{o.userName || o.userEmail}</b>
                      <small>
                        {o.items.map(i => i.title).join(', ')} ·{' '}
                        <span className="font-bold text-[var(--green)]">
                          {o.total} {t.common.currency}
                        </span>
                      </small>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {o.receiptUrl && (
                      <a
                        href={o.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--bronze)] underline mx-2"
                      >
                        {t.admin.receiptLink}
                      </a>
                    )}
                    <button
                      onClick={() => handleApprove(o)}
                      className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1"
                      title={t.admin.approveBtn}
                    >
                      <Check size={13} /> {t.admin.approveBtn}
                    </button>
                    <button
                      onClick={() => handleReject(o.id)}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white text-xs"
                      title={t.admin.rejectBtn}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{t.admin.quickActionsEyebrow}</span>
              <h2>{t.admin.quickActionsTitle}</h2>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <Link
              to="/admin/novels"
              className="flex items-center justify-between p-3 border border-[var(--line)] bg-[var(--paper)] text-xs hover:border-[var(--green)]"
            >
              <span>{t.admin.addNewNovelLink}</span>
              <Plus size={15} />
            </Link>
            <Link
              to="/admin/chapters"
              className="flex items-center justify-between p-3 border border-[var(--line)] bg-[var(--paper)] text-xs hover:border-[var(--green)]"
            >
              <span>{t.admin.editChaptersLink}</span>
              <ArrowIcon size={15} />
            </Link>
            <Link
              to="/admin/plans-coupons"
              className="flex items-center justify-between p-3 border border-[var(--line)] bg-[var(--paper)] text-xs hover:border-[var(--green)]"
            >
              <span>{t.admin.createCouponLink}</span>
              <Plus size={15} />
            </Link>
            <Link
              to="/admin/settings"
              className="flex items-center justify-between p-3 border border-[var(--line)] bg-[var(--paper)] text-xs hover:border-[var(--green)]"
            >
              <span>{t.admin.updatePaymentNumbersLink}</span>
              <ArrowIcon size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Novels Content Table */}
      <div className="admin-panel table-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{t.admin.registeredNovelsEyebrow}</span>
            <h2>{t.admin.registeredNovelsTitle}</h2>
          </div>
          <Link to="/admin/novels" className="primary-button small">
            {t.admin.manageNovelsBtn} <Plus size={15} />
          </Link>
        </div>

        <table>
          <thead>
            <tr>
              <th>{t.admin.colNovel}</th>
              <th>{t.admin.colAuthor}</th>
              <th>{t.admin.colGenre}</th>
              <th>{t.admin.colStatus}</th>
              <th>{t.admin.colChapters}</th>
              <th>{t.admin.colNovelPrice}</th>
              <th>{t.admin.colBookPrice}</th>
              <th>{t.admin.colPublishing}</th>
            </tr>
          </thead>
          <tbody>
            {novels.map(novel => {
              const novelTitle = getLocalizedNovelField(novel, 'title', language);
              const authorName = getLocalizedNovelField(novel, 'author', language);
              const genreName = getLocalizedGenres(novel, language).join('، ');
              const statusName = t.statusLabels[novel.status] || novel.status;

              return (
                <tr key={novel.id}>
                  <td>
                    <div className="table-book">
                      <Cover novel={novel} />
                      <b>{novelTitle}</b>
                    </div>
                  </td>
                  <td>{authorName}</td>
                  <td>{genreName}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        novel.status === 'مكتملة' ? 'done' : ''
                      }`}
                    >
                      {statusName}
                    </span>
                  </td>
                  <td>{novel.chaptersCount} {t.common.chaptersCount}</td>
                  <td>{novel.novelPrice} {t.common.currency}</td>
                  <td>{novel.bookPrice ? `${novel.bookPrice} ${t.common.currency}` : '—'}</td>
                  <td>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold ${
                        novel.published
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {novel.published ? t.common.published : t.common.draft}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
