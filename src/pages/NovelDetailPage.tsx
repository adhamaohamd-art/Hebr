import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ShoppingBag,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Download,
} from 'lucide-react';
import { Cover } from '../components/Cover';
import { SectionTitle } from '../components/SectionTitle';
import { PageMeta } from '../components/PageMeta';
import { LoadingState, ErrorState } from '../components/States';
import { NovelReviews } from '../components/NovelReviews';
import { novelService } from '../services/novelService';
import { libraryService } from '../services/libraryService';
import { bookFileService } from '../services/bookFileService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Novel, ChapterMeta, Entitlement } from '../types';
import { getLocalizedNovelField, getLocalizedChapterTitle } from '../i18n/translations';
import { getFriendlyErrorMessage } from '../lib/firebase';
import { getNovelRatingSummary } from '../lib/rating';
import { getLocalizedGenres } from '../lib/genres';

export const NovelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const { t, language, rtl } = useLanguage();

  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [addedNote, setAddedNote] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const BackArrow = rtl ? ArrowRight : ArrowLeft;
  const RowChevron = rtl ? ChevronLeft : ChevronRight;

  useEffect(() => {
    async function loadNovel() {
      if (!id || authLoading) return;
      try {
        setLoading(true);
        setLoadError('');
        const data = await novelService.getNovelById(id);
        if (data) {
          setNovel(data);
          const chs = await novelService.getChapters(id, true);
          setChapters(chs);
          if (user) {
            const ent = await libraryService.getUserEntitlement(user.uid, id);
            setEntitlement(ent);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Error loading novel:', err);
        setLoadError(getFriendlyErrorMessage(err, language));
      } finally {
        setLoading(false);
      }
    }
    loadNovel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.uid, isAdmin, profile?.subscription?.expiresAt, authLoading, reloadKey, language]);

  if (loading || authLoading) {
    return (
      <div className="page-container">
        <LoadingState message={t.common.loading} />
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="page-container">
        <ErrorState
          title={loadError ? t.common.error : t.novelDetail.notFoundTitle}
          error={loadError || t.novelDetail.notFoundDesc}
          onRetry={loadError ? () => setReloadKey(k => k + 1) : () => navigate('/browse')}
        />
      </div>
    );
  }

  const title = getLocalizedNovelField(novel, 'title', language);
  const author = getLocalizedNovelField(novel, 'author', language);
  const description = getLocalizedNovelField(novel, 'description', language);
  const genre = getLocalizedGenres(novel, language).join(' · ');
  const statusLabel = t.statusLabels[novel.status] || novel.status;

  const handleAddNovel = () => {
    addToCart({
      id: `novel_${novel.id}`,
      type: 'novel',
      refId: novel.id,
      title: title,
      author: author,
      price: novel.novelPrice,
      coverColor: novel.color,
      coverAccent: novel.accent,
      coverUrl: novel.coverUrl,
    });
    setAddedNote(t.novelDetail.addedNovelToast);
    setTimeout(() => setAddedNote(''), 3000);
  };

  const handleAddBook = () => {
    if (!novel.bookPrice) return;
    addToCart({
      id: `book_${novel.id}`,
      type: 'book',
      refId: novel.id,
      title: `${title} (${t.store.editionLabel} + PDF)`,
      author: author,
      price: novel.bookPrice,
      coverColor: novel.color,
      coverAccent: novel.accent,
      coverUrl: novel.coverUrl,
    });
    setAddedNote(t.novelDetail.addedBookToast);
    setTimeout(() => setAddedNote(''), 3000);
  };

  const handleDownloadBook = async () => {
    if (!novel) return;
    try {
      setDownloading(true);
      setDownloadError('');
      const bookFile = await bookFileService.getBookFile(novel.id);
      if (bookFile?.fileUrl && bookFile.fileUrl.startsWith('https://')) {
        window.open(bookFile.fileUrl, '_blank', 'noopener,noreferrer');
      } else {
        setDownloadError(t.novelDetail.downloadBookMissing);
        setTimeout(() => setDownloadError(''), 5000);
      }
    } catch {
      setDownloadError(t.novelDetail.downloadBookMissing);
      setTimeout(() => setDownloadError(''), 5000);
    } finally {
      setDownloading(false);
    }
  };

  const hasPurchasedNovel = Boolean(entitlement);
  const hasPurchasedBook = entitlement?.type === 'book';

  return (
    <div className="page-container detail-page">
      <PageMeta
        title={title}
        description={`${title} - ${author}. ${description}`}
      />

      <button className="back-button" onClick={() => navigate('/browse')}>
        <BackArrow size={17} /> {t.novelDetail.backToNovels}
      </button>

      <div className="novel-detail">
        <div className="detail-cover">
          <Cover novel={novel} large />
          <span className="cover-shadow" />
        </div>

        <div className="detail-copy">
          <div className="card-meta">
            <span>{genre}</span>
            <span>{statusLabel}</span>
          </div>

          <h1>{title}</h1>
          <p className="byline">
            {t.novelDetail.byAuthor} <strong>{author}</strong>
          </p>

          <p className="detail-description">{description}</p>

          <div className="detail-stats">
            <span>
              <b>{chapters.length || novel.chaptersCount}</b>
              <small>{t.common.chaptersCount}</small>
            </span>
            <span>
              <b>{novel.freeChapters || 1}</b>
              <small>{t.novelDetail.freeChaptersStat}</small>
            </span>
            {(() => {
              const ratingSummary = getNovelRatingSummary(novel);
              return (
                <span>
                  <b>
                    {ratingSummary.hasRatings ? `★ ${ratingSummary.displayAverage}` : '—'}
                  </b>
                  <small>
                    {ratingSummary.isEditorial
                      ? t.novelReviews.editorialRatingBadge
                      : ratingSummary.isCombined
                      ? (language === 'ar'
                          ? `تقييم مدمج (${ratingSummary.totalCount}: ${ratingSummary.visitorCount} قراء + ${ratingSummary.adminCount} تحرير)`
                          : `Combined (${ratingSummary.totalCount}: ${ratingSummary.visitorCount} readers + ${ratingSummary.adminCount} editorial)`)
                      : ratingSummary.isCustom
                      ? (language === 'ar' ? 'تقييم معتمد' : 'Curated Score')
                      : ratingSummary.hasRatings
                      ? `${t.novelDetail.ratingStat} (${ratingSummary.visitorCount})`
                      : (language === 'ar' ? 'لا توجد تقييمات بعد' : 'No ratings yet')}
                  </small>
                </span>
              );
            })()}
          </div>

          {addedNote && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
              <Check size={16} /> {addedNote}
            </div>
          )}

          {downloadError && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-xs border border-amber-200 flex items-center justify-between">
              <span>{downloadError}</span>
              <button onClick={() => setDownloadError('')} className="underline text-xs">
                {t.common.close}
              </button>
            </div>
          )}

          <div className="detail-actions">
            {chapters.length > 0 && (
              <button
                className="primary-button"
                onClick={() => navigate(`/novel/${novel.id}/chapter/${chapters[0].number}`)}
              >
                <BookOpen size={17} /> {t.common.startReading}
              </button>
            )}

            {!hasPurchasedNovel && (
              <button className="outline-button" onClick={handleAddNovel}>
                <ShoppingBag size={17} />
                {t.novelDetail.acquireNovelBtn} · {novel.novelPrice} {t.common.currency}
              </button>
            )}

            {novel.bookPrice && !hasPurchasedBook && (
              <button className="outline-button" onClick={handleAddBook}>
                <Download size={17} />
                {t.novelDetail.acquireBookBtn} · {novel.bookPrice} {t.common.currency}
              </button>
            )}

            {hasPurchasedBook && (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--green)] text-white text-xs font-medium">
                  <Check size={15} /> {t.novelDetail.ownedBookBadge}
                </span>
                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownloadBook}
                  className="outline-button flex items-center gap-1.5"
                >
                  <Download size={16} />
                  {downloading ? t.common.loading : t.novelDetail.downloadBookBtn}
                </button>
              </>
            )}

            {hasPurchasedNovel && !hasPurchasedBook && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--green)] text-white text-xs font-medium">
                <Check size={15} /> {t.novelDetail.ownedNovelBadge}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chapters list and Author details */}
      <div className="detail-lower">
        <div className="chapter-panel">
          <SectionTitle eyebrow={t.novelDetail.chaptersEyebrow} title={t.novelDetail.chaptersTitle} />

          {chapters.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted)] text-sm border border-[var(--line)]">
              {t.novelDetail.noChaptersYet}
            </div>
          ) : (
            <div className="chapter-list">
              {chapters.map(ch => {
                const unlockStatus = libraryService.checkChapterUnlocked(
                  novel,
                  ch,
                  profile,
                  entitlement,
                  isAdmin
                );

                const chapterTitle = getLocalizedChapterTitle(ch, language);

                return (
                  <button
                    key={ch.id}
                    className="chapter-row"
                    onClick={() => navigate(`/novel/${novel.id}/chapter/${ch.number}`)}
                  >
                    <span className="chapter-index">
                      {String(ch.number).padStart(2, '0')}
                    </span>
                    <div>
                      <b>
                        {t.novelDetail.chapterNumberPrefix} {ch.number} · {chapterTitle}
                      </b>
                      <small>
                        {unlockStatus.isUnlocked
                          ? t.novelDetail.availableNow
                          : t.common.requiresPurchaseOrSub}
                      </small>
                    </div>
                    <span
                      className={
                        unlockStatus.isUnlocked ? 'chapter-free' : 'chapter-lock'
                      }
                    >
                      {unlockStatus.isUnlocked ? (
                        t.common.free
                      ) : (
                        <span className="flex items-center gap-1">
                          <Lock size={12} /> {t.common.locked}
                        </span>
                      )}
                    </span>
                    <RowChevron size={16} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="author-card">
          <span className="author-avatar">{author ? author[0] : 'ح'}</span>
          <span className="eyebrow">{t.novelDetail.aboutAuthorEyebrow}</span>
          <h3>{author}</h3>
          <p>{t.novelDetail.aboutAuthorBio}</p>
          <Link to={`/browse`} className="text-button">
            {t.novelDetail.exploreMoreInHebr}
          </Link>
        </aside>
      </div>

      {/* Genuine Visitor Ratings and Reviews */}
      <NovelReviews novel={novel} onRatingUpdated={() => setReloadKey(k => k + 1)} />
    </div>
  );
};
