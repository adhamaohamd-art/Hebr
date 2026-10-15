import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Check, Download, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Cover } from '../components/Cover';
import { PageMeta } from '../components/PageMeta';
import { LoadingState, EmptyState, ErrorState } from '../components/States';
import { getFriendlyErrorMessage } from '../lib/firebase';
import { novelService } from '../services/novelService';
import { libraryService } from '../services/libraryService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Novel, Entitlement } from '../types';
import { getLocalizedNovelField } from '../i18n/translations';
import { getNovelRatingSummary } from '../lib/rating';
import { getLocalizedGenres } from '../lib/genres';

export const StorePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [entitlements, setEntitlements] = useState<Record<string, Entitlement>>({});

  // Which digital editions the signed-in reader already owns (type 'book').
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setEntitlements({});
      return;
    }
    let cancelled = false;
    libraryService.getUserEntitlements(user.uid).then(ents => {
      if (!cancelled) setEntitlements(ents);
    });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true);
        setLoadError('');
        const data = await novelService.getNovels({ publishedOnly: true });
        setNovels(data);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Error loading store books:', err);
        setLoadError(getFriendlyErrorMessage(err, language));
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, [reloadKey, language]);

  const handleAddNovel = (novel: Novel) => {
    addToCart({
      id: `novel_${novel.id}`,
      type: 'novel',
      refId: novel.id,
      title: getLocalizedNovelField(novel, 'title', language),
      author: getLocalizedNovelField(novel, 'author', language),
      price: novel.novelPrice,
      coverColor: novel.color,
      coverAccent: novel.accent,
      coverUrl: novel.coverUrl,
    });
    setAddedIds(prev => ({ ...prev, [`novel_${novel.id}`]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [`novel_${novel.id}`]: false }));
    }, 2500);
  };

  const handleAddBook = (novel: Novel) => {
    const title = getLocalizedNovelField(novel, 'title', language);
    const author = getLocalizedNovelField(novel, 'author', language);

    addToCart({
      id: `book_${novel.id}`,
      type: 'book',
      refId: novel.id,
      title: `${title} (${t.store.editionLabel} + PDF)`,
      author: author,
      price: novel.bookPrice || novel.novelPrice,
      coverColor: novel.color,
      coverAccent: novel.accent,
      coverUrl: novel.coverUrl,
    });
    setAddedIds(prev => ({ ...prev, [`book_${novel.id}`]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [`book_${novel.id}`]: false }));
    }, 2500);
  };

  return (
    <div className="page-container">
      <PageMeta
        title={t.store.pageTitle}
        description={t.store.pageMetaDesc}
      />

      <div className="page-heading">
        <div>
          <span className="eyebrow">{t.store.eyebrow}</span>
          <h1>{t.store.title}</h1>
          <p>{t.store.subtitle}</p>
        </div>
        <div className="store-stamp">
          <ShoppingBag size={25} />
          <span>{t.store.badgeStamp}</span>
        </div>
      </div>

      {loading ? (
        <LoadingState message={t.store.loadingMessage} />
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={() => setReloadKey(k => k + 1)} />
      ) : novels.length > 0 ? (
        <div className="store-grid">
          {novels.map(novel => {
            const novelOwned = Boolean(entitlements[novel.id]);
            const hasBook = Boolean(novel.bookPrice);
            const title = getLocalizedNovelField(novel, 'title', language);
            const author = getLocalizedNovelField(novel, 'author', language);
            const genres = getLocalizedGenres(novel, language).slice(0, 2);
            const rating = getNovelRatingSummary(novel);
            const novelAdded = Boolean(addedIds[`novel_${novel.id}`]);
            const bookAdded = Boolean(addedIds[`book_${novel.id}`]);
            const owned = entitlements[novel.id]?.type === 'book';
            const ratingLabel = rating.hasRatings
              ? `${rating.displayAverage} / 5, ${rating.visitorCount} ${t.store.ratingsLabel}`
              : t.store.noRatingsYet;

            return (
              <article className={`book-card ${owned ? 'owned' : ''}`} key={novel.id}>
                <Link
                  to={`/novel/${novel.id}`}
                  className="book-card-cover"
                  aria-label={title}
                >
                  <Cover novel={novel} small />
                </Link>

                <div className="book-card-body">
                  {owned && (
                    <span className="book-owned">
                      <Check size={14} />
                      {t.store.ownedBadge}
                    </span>
                  )}
                  <div className="book-card-tags">
                    {genres.map(g => (
                      <span className="book-tag" key={g}>{g}</span>
                    ))}
                    {hasBook && <span className="book-tag format">PDF</span>}
                    {hasBook && <span className="book-tag format">EPUB</span>}
                  </div>

                  <h3>
                    <Link to={`/novel/${novel.id}`}>{title}</Link>
                  </h3>
                  <p className="book-card-author">{author}</p>

                  <div className="book-card-meta">
                    <span className="book-rating" role="img" aria-label={ratingLabel}>
                      <span className="stars" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span
                            key={star}
                            className={
                              rating.hasRatings && star <= Math.round(rating.average || 0)
                                ? 'star-on'
                                : 'star-off'
                            }
                          >
                            ★
                          </span>
                        ))}
                      </span>
                      {rating.hasRatings ? (
                        <>
                          <strong>{rating.displayAverage}</strong>
                          <span>({rating.visitorCount})</span>
                        </>
                      ) : (
                        <span>{t.store.noRatingsYet}</span>
                      )}
                    </span>
                    {novel.chaptersCount ? (
                      <span>{novel.chaptersCount} {t.common.chaptersCount}</span>
                    ) : null}
                  </div>

                  <div className="buy-options">
                    {/* Option 1: the novel itself (read online) */}
                    <div className="buy-option">
                      <div className="buy-option-info">
                        <strong>{t.store.novelOptionTitle}</strong>
                        <small><BookOpen size={13} />{t.store.perkRead}</small>
                      </div>
                      <div className="buy-option-action">
                        <span className="book-price">
                          {novel.novelPrice}<small>{t.common.currency}</small>
                        </span>
                        {novelOwned ? (
                          <span className="buy-owned"><Check size={14} />{t.store.ownedShort}</span>
                        ) : (
                          <button
                            className={`primary-button small ${novelAdded ? 'added' : ''}`}
                            onClick={() => handleAddNovel(novel)}
                          >
                            {novelAdded ? t.store.addedToast : <>{t.store.addToCartBtn} <Plus size={15} /></>}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Option 2: the digital edition (PDF/EPUB), only when it has a price */}
                    {hasBook && (
                      <div className="buy-option">
                        <div className="buy-option-info">
                          <strong>{t.store.bookOptionTitle}</strong>
                          <small><Download size={13} />{t.store.perkDownload}</small>
                        </div>
                        <div className="buy-option-action">
                          <span className="book-price">
                            {novel.bookPrice}<small>{t.common.currency}</small>
                          </span>
                          {owned ? (
                            <span className="buy-owned"><Check size={14} />{t.store.ownedShort}</span>
                          ) : (
                            <button
                              className={`primary-button small ${bookAdded ? 'added' : ''}`}
                              onClick={() => handleAddBook(novel)}
                            >
                              {bookAdded ? t.store.addedToast : <>{t.store.addToCartBtn} <Plus size={15} /></>}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="book-card-links">
                    <Link to={`/novel/${novel.id}`} className="book-card-details">
                      {t.store.detailsLink}
                    </Link>
                    {(owned || novelOwned) && (
                      <Link to={owned ? '/library' : `/novel/${novel.id}/chapter/1`} className="book-card-details">
                        {owned ? t.store.inLibraryLink : t.store.readNowBtn}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={t.store.emptyTitle}
          description={t.store.emptyDesc}
          actionText={t.store.browseNovelsBtn}
          onAction={() => navigate('/browse')}
        />
      )}
    </div>
  );
};
