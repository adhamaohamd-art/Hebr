import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Cover } from '../components/Cover';
import { PageMeta } from '../components/PageMeta';
import { LoadingState, EmptyState, ErrorState } from '../components/States';
import { getFriendlyErrorMessage } from '../lib/firebase';
import { novelService } from '../services/novelService';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Novel } from '../types';
import { getLocalizedNovelField } from '../i18n/translations';

export const StorePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

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
    setAddedIds(prev => ({ ...prev, [novel.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [novel.id]: false }));
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
            const price = novel.bookPrice || novel.novelPrice || 45;
            const title = getLocalizedNovelField(novel, 'title', language);
            const author = getLocalizedNovelField(novel, 'author', language);

            return (
              <article className="product-card" key={novel.id}>
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/novel/${novel.id}`)}
                >
                  <Cover novel={novel} large />
                </div>
                <div className="product-info">
                  <span className="eyebrow">{t.store.editionLabel}</span>
                  <h3
                    className="cursor-pointer"
                    onClick={() => navigate(`/novel/${novel.id}`)}
                  >
                    {title}
                  </h3>
                  <p>{author}</p>
                  <p className="text-xs text-[var(--muted)] my-2">
                    {t.store.featuresDesc}
                  </p>
                  <div className="product-bottom">
                    <strong>{price} {t.common.currency}</strong>
                    <button
                      className="outline-button small"
                      onClick={() => handleAddBook(novel)}
                    >
                      {addedIds[novel.id] ? (
                        t.store.addedToast
                      ) : (
                        <>
                          {t.store.addToCartBtn} <Plus size={15} />
                        </>
                      )}
                    </button>
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
