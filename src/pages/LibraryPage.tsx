import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Hash,
  Phone,
} from 'lucide-react';
import { NovelCard } from '../components/NovelCard';
import { Cover } from '../components/Cover';
import { PageMeta } from '../components/PageMeta';
import { LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { libraryService } from '../services/libraryService';
import { novelService } from '../services/novelService';
import { orderService } from '../services/orderService';
import { BookDownloadButtons } from '../components/BookDownloadButtons';
import { Novel, UserLibraryItem, Entitlement, Order } from '../types';
import { getLocalizedNovelField } from '../i18n/translations';

export const LibraryPage: React.FC = () => {
  const { user, profile, isSubscribed, subscription, loading: authLoading } = useAuth();
  const { t, language, rtl } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'continue' | 'bookmarks' | 'orders' | 'purchased'>('continue');
  const [libraryItems, setLibraryItems] = useState<UserLibraryItem[]>([]);
  const [allNovels, setAllNovels] = useState<Novel[]>([]);
  const [entitlements, setEntitlements] = useState<Record<string, Entitlement>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const ArrowIcon = rtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/library');
      return;
    }

    async function loadUserData() {
      if (!user) return;
      try {
        setLoading(true);
        // Requirement A.2: Non-admins read published novels via the single catalog/home document!
        const [libItems, catalogNovels, ents, userOrders] = await Promise.all([
          libraryService.getUserLibrary(user.uid),
          novelService.getNovels({ publishedOnly: true }),
          libraryService.getUserEntitlements(user.uid),
          orderService.getOrders(user.uid),
        ]);

        // If any user entitlement or library item refers to a novel not currently in catalog/home,
        // resolve that specific novel document on-demand (idempotent, minimal reads)
        const catalogMap = new Map<string, Novel>(catalogNovels.map(n => [n.id, n]));
        const missingIds = new Set<string>();

        Object.keys(ents).forEach(id => {
          if (!catalogMap.has(id)) missingIds.add(id);
        });
        libItems.forEach(item => {
          if (!catalogMap.has(item.novelId)) missingIds.add(item.novelId);
        });

        if (missingIds.size > 0) {
          const fetchedMissing = await Promise.all(
            Array.from(missingIds).map(id => novelService.getNovelById(id))
          );
          fetchedMissing.forEach(novel => {
            if (novel) catalogMap.set(novel.id, novel);
          });
        }

        setLibraryItems(libItems);
        setAllNovels(Array.from(catalogMap.values()));
        setEntitlements(ents);
        setOrders(userOrders);
      } catch (err) {
        console.warn('Error loading library:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadUserData();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="page-container library-page">
        <LoadingState message={t.library.loadingMessage} />
      </div>
    );
  }

  if (!user) return null;

  // "Continue Reading" banner: ONLY for novels the user has really started reading.
  // (Bookmark-only entries have no lastChapter, and a brand-new account has no entries at all:
  // in both cases the banner must not invent any progress.)
  const readingItems = libraryItems.filter(i => (i.lastChapter ?? 0) >= 1);
  const recentItem = [...readingItems].sort((a, b) => {
    const timeA = (a.updatedAt as { toMillis?: () => number })?.toMillis ? (a.updatedAt as { toMillis: () => number }).toMillis() : 0;
    const timeB = (b.updatedAt as { toMillis?: () => number })?.toMillis ? (b.updatedAt as { toMillis: () => number }).toMillis() : 0;
    return timeB - timeA;
  })[0];

  const continueNovel = recentItem ? allNovels.find(n => n.id === recentItem.novelId) : undefined;
  const lastChapterNum = recentItem?.lastChapter ?? 1;
  const progressPercent = continueNovel
    ? Math.min(100, Math.round((lastChapterNum / Math.max(1, continueNovel.chaptersCount)) * 100))
    : 0;

  // Suggestions: novels the user has not started or saved yet (falls back to the catalog order)
  const touchedNovelIds = new Set(libraryItems.filter(i => (i.lastChapter ?? 0) >= 1 || i.bookmarked).map(i => i.novelId));
  const untouchedNovels = allNovels.filter(n => !touchedNovelIds.has(n.id));
  const suggestedNovels = (untouchedNovels.length > 0 ? untouchedNovels : allNovels).slice(0, 3);

  // Filter bookmarked novels
  const bookmarkedNovelIds = new Set(libraryItems.filter(i => i.bookmarked).map(i => i.novelId));
  const bookmarkedNovels = allNovels.filter(n => bookmarkedNovelIds.has(n.id));

  // Filter purchased novels
  const purchasedNovelIds = Object.keys(entitlements);
  const purchasedNovels = allNovels.filter(n => purchasedNovelIds.includes(n.id));

  const userName = profile?.name || user.email?.split('@')[0] || (language === 'ar' ? 'القارئ' : 'Reader');

  return (
    <div className="page-container library-page">
      <PageMeta
        title={t.library.pageTitle}
        description={t.library.pageMetaDesc}
      />

      <div className="page-heading compact">
        <div>
          <span className="eyebrow">{t.library.eyebrow}</span>
          <h1>{t.library.welcomePrefix} {userName}</h1>
          <p>{t.library.subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {isSubscribed ? (
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs flex items-center gap-1.5 font-medium">
              <Sparkles size={14} />
              {t.library.subscribedBadge} {subscription?.planName || t.home.plansEyebrow}
            </div>
          ) : (
            <Link to="/plans" className="outline-button small">
              <Sparkles size={14} /> {t.library.activateSubBtn}
            </Link>
          )}

          <div className="profile-chip">
            <span>{userName[0]}</span>
            <div>
              <b>{userName}</b>
              <small>{user.email}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="library-tabs">
        <button
          className={activeTab === 'continue' ? 'active' : ''}
          onClick={() => setActiveTab('continue')}
        >
          {t.library.tabContinue}
        </button>
        <button
          className={activeTab === 'purchased' ? 'active' : ''}
          onClick={() => setActiveTab('purchased')}
        >
          {t.library.tabPurchased} ({purchasedNovels.length})
        </button>
        <button
          className={activeTab === 'bookmarks' ? 'active' : ''}
          onClick={() => setActiveTab('bookmarks')}
        >
          {t.library.tabBookmarks} ({bookmarkedNovels.length})
        </button>
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          {t.library.tabOrders} ({orders.length})
        </button>
      </div>

      {/* Tab 1: Continue Reading */}
      {activeTab === 'continue' && (
        <>
          {continueNovel ? (
            <div className="continue-card">
              <Cover novel={continueNovel} />
              <div>
                <span className="eyebrow">{t.library.currentlyReading}</span>
                <h2>{getLocalizedNovelField(continueNovel, 'title', language)}</h2>
                <p>
                  {t.novelDetail.chapterNumberPrefix} {lastChapterNum} {t.library.chapterOf} {continueNovel.chaptersCount} · {getLocalizedNovelField(continueNovel, 'author', language)}
                </p>
                <div className="progress-bar">
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
                <small>{progressPercent}{t.library.completedPercent}</small>
                <button
                  className="primary-button"
                  onClick={() =>
                    navigate(`/novel/${continueNovel.id}/chapter/${lastChapterNum}`)
                  }
                >
                  {t.library.continueReadingBtn} <ArrowIcon size={16} />
                </button>
              </div>
              <div className="continue-mark">{progressPercent}%</div>
            </div>
          ) : (
            <div className="p-8 my-6 text-center text-sm border border-[var(--line)] bg-white">
              {t.library.noReadingStarted}
              <div className="mt-3">
                <Link to="/browse" className="primary-button small">
                  {t.library.exploreNovelsNow}
                </Link>
              </div>
            </div>
          )}

          <div className="mt-12">
            <h3 className="font-serif text-2xl mb-6">{t.library.recommendedTitle}</h3>
            <div className="library-grid">
              {suggestedNovels.map(n => (
                <NovelCard key={n.id} novel={n} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Purchased Digital Items */}
      {activeTab === 'purchased' && (
        <div>
          {purchasedNovels.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[var(--line)] bg-white">
              <BookOpen size={36} className="mx-auto mb-3 text-[var(--bronze)]" />
              <h3 className="font-serif text-xl mb-1">{t.library.purchasedEmptyTitle}</h3>
              <p className="text-xs text-[var(--muted)] mb-4">
                {t.library.purchasedEmptyDesc}
              </p>
              <Link to="/store" className="primary-button small">
                {t.library.visitStoreBtn}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {purchasedNovels.map(novel => {
                const ent = entitlements[novel.id];
                const isBook = ent?.type === 'book';
                const title = getLocalizedNovelField(novel, 'title', language);
                const author = getLocalizedNovelField(novel, 'author', language);

                return (
                  <div
                    key={novel.id}
                    className="p-5 border border-[var(--line)] bg-white flex gap-5 items-center text-start"
                  >
                    <div className="w-24 shrink-0">
                      <Cover novel={novel} />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-[var(--bronze)] font-semibold block mb-1">
                        {isBook ? t.library.purchasedBookLabel : t.library.purchasedNovelLabel}
                      </span>
                      <h4 className="font-serif text-xl font-medium mb-1">{title}</h4>
                      <p className="text-xs text-[var(--muted)] mb-3">{author}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          to={`/novel/${novel.id}/chapter/1`}
                          className="primary-button small"
                        >
                          <BookOpen size={14} /> {t.library.readChaptersBtn}
                        </Link>
                      </div>
                      {isBook && (
                        <div className="mt-3">
                          <BookDownloadButtons
                            small
                            novel={{ id: novel.id, title: novel.title, author: novel.author }}
                            licensedTo={profile?.name || user?.email || undefined}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div>
          {bookmarkedNovels.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[var(--line)] bg-white">
              <h3 className="font-serif text-xl mb-1">{t.library.bookmarksEmptyTitle}</h3>
              <p className="text-xs text-[var(--muted)] mb-4">
                {t.library.bookmarksEmptyDesc}
              </p>
              <Link to="/browse" className="primary-button small">
                {t.common.browse}
              </Link>
            </div>
          ) : (
            <div className="library-grid">
              {bookmarkedNovels.map(n => (
                <NovelCard key={n.id} novel={n} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Orders History */}
      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[var(--line)] bg-white">
              <h3 className="font-serif text-xl mb-1">{t.library.ordersEmptyTitle}</h3>
              <p className="text-xs text-[var(--muted)] mb-4">
                {t.library.ordersEmptyDesc}
              </p>
              <Link to="/browse" className="primary-button small">
                {t.common.explore}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const statusBadge = {
                  pending: {
                    text: t.library.statusPending,
                    icon: Clock,
                    className: 'bg-amber-50 text-amber-800 border-amber-300',
                  },
                  approved: {
                    text: t.library.statusApproved,
                    icon: CheckCircle2,
                    className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                  },
                  rejected: {
                    text: t.library.statusRejected,
                    icon: XCircle,
                    className: 'bg-red-50 text-red-800 border-red-300',
                  },
                }[order.status];

                const StatusIcon = statusBadge.icon;

                return (
                  <div
                    key={order.id}
                    className="p-5 border border-[var(--line)] bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 text-start"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-[var(--muted)]">
                          {t.library.orderNumberPrefix}{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs border font-medium ${statusBadge.className}`}
                        >
                          <StatusIcon size={12} /> {statusBadge.text}
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {order.items.map(i => i.title).join(' + ')}
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1 space-x-2 rtl:space-x-reverse">
                        <span>
                          {t.library.paymentMethodLabel}:{' '}
                          {order.paymentMethod === 'vodafone_cash' ? t.checkout.vodafoneCashTitle : t.checkout.instapayTitle}
                        </span>
                        <span>·</span>
                        {order.senderPhone && (
                          <span className="font-mono inline-flex items-center gap-1">
                            <Phone size={11} /> {order.senderPhone} ·
                          </span>
                        )}
                        {order.transactionRef && (
                          <span className="font-mono inline-flex items-center gap-1">
                            <Hash size={11} /> {order.transactionRef} ·
                          </span>
                        )}
                        {order.couponCode && `${t.library.couponLabel}: ${order.couponCode} · `}
                        <span>
                          {t.library.orderTotalLabel}: <b>{order.total} {t.common.currency}</b>
                        </span>
                      </div>
                      {order.adminNote && (
                        <p className="text-xs text-stone-600 mt-2 bg-stone-50 p-2 border border-stone-200">
                          {t.library.adminNotePrefix}: {order.adminNote}
                        </p>
                      )}
                    </div>

                    {order.receiptUrl && (
                      <a
                        href={order.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="outline-button small shrink-0"
                      >
                        {t.library.viewReceiptBtn}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
