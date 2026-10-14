import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Feather } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { NovelCard } from '../components/NovelCard';
import { PageMeta } from '../components/PageMeta';
import { LoadingState, ErrorState } from '../components/States';
import { getFriendlyErrorMessage } from '../lib/firebase';
import { novelService } from '../services/novelService';
import { Novel } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const HomePage: React.FC = () => {
  const { t, language, rtl } = useLanguage();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Novel[]>([]);
  const [recent, setRecent] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [stats, setStats] = useState({ novels: 0, authors: 0 });

  const ArrowIcon = rtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setLoadError('');
        const novels = await novelService.getNovels({ publishedOnly: true });
        setFeatured(novels.slice(0, 3));
        setRecent(novels.slice(3, 7));
        // Real numbers from the catalog (the old hero used hard-coded fake figures).
        setStats({
          novels: novels.length,
          authors: new Set(novels.map(n => n.author).filter(Boolean)).size,
        });
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Error loading home novels:', e);
        setLoadError(getFriendlyErrorMessage(e, language));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [reloadKey, language]);

  const formatCount = (n: number) => n.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');

  return (
    <>
      <PageMeta
        title={t.common.home}
        description={t.browse.pageMetaDesc}
      />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">{t.home.heroEyebrow}</span>
          <h1>
            {t.home.heroTitlePart1}
            <br />
            <i>{t.home.heroTitlePart2}</i>
          </h1>
          <p>{t.home.heroDesc}</p>

          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate('/browse')}>
              {t.common.explore}
              <ArrowIcon size={17} />
            </button>
            <button className="quiet-button" onClick={() => navigate('/store')}>
              {t.home.heroStoreButton} <ArrowIcon size={16} />
            </button>
          </div>

          <div className="hero-stats">
            <span>
              <b>{formatCount(stats.novels)}</b>
              <small>{t.home.statNovels}</small>
            </span>
            <span>
              <b>{formatCount(stats.authors)}</b>
              <small>{t.home.statAuthors}</small>
            </span>
          </div>
        </div>

        <div className="hero-art">
          <div className="art-number">01</div>
          <div className="paper-shape" />
          <div className="ink-bottle">
            <span />
          </div>
          <div className="quill">
            <Feather size={100} strokeWidth={1.1} />
          </div>
          <div className="book-stack">
            <div className="book book-one" />
            <div className="book book-two" />
            <div className="book book-three" />
            <div className="book book-four" />
          </div>
          <span className="art-caption">{t.home.heroArtCaption}</span>
          <div className="art-scribble">✦</div>
        </div>

        <div className="hero-side-note">
          {t.home.heroScrollNote} <ArrowIcon size={14} />
        </div>
      </section>

      {/* Featured Section */}
      <section className="home-section">
        <SectionTitle
          eyebrow={t.home.curatedEyebrow}
          title={t.home.curatedTitle}
          action={t.common.viewAll}
          actionLink="/browse"
        />

        {loading ? (
          <LoadingState message={t.home.loadingCurated} />
        ) : loadError ? (
          <ErrorState error={loadError} onRetry={() => setReloadKey(k => k + 1)} />
        ) : featured.length > 0 ? (
          <div className="featured-grid">
            {featured.map(novel => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>{t.home.emptyCuratedTitle}</h3>
            <p>{t.home.emptyCuratedDesc}</p>
          </div>
        )}
      </section>

      {/* Recent Releases Section */}
      <section className="home-section pale-section">
        <SectionTitle
          eyebrow={t.home.newShelfEyebrow}
          title={t.home.newShelfTitle}
          action={t.common.viewAll}
          actionLink="/browse"
        />
        {loading ? (
          <LoadingState message={t.home.loadingNewShelf} />
        ) : loadError ? null : recent.length > 0 ? (
          <div className="horizontal-novels">
            {recent.map(novel => (
              <NovelCard key={novel.id} novel={novel} compact />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-[var(--muted)]">
            {t.home.allInFeaturedNote}
          </div>
        )}
      </section>

      {/* Literary Quote */}
      <section className="quote-section">
        <div className="quote-mark">“</div>
        <blockquote>
          {t.home.quoteText}
          <br />
          <em>{t.home.quoteEm}</em>
        </blockquote>
        <span>{t.home.quoteAuthor}</span>
      </section>

      {/* Subscription Plans Banner */}
      <section className="plans-banner">
        <div>
          <span className="eyebrow">{t.home.plansEyebrow}</span>
          <h2>
            {t.home.plansTitlePart1}
            <br />
            <em>{t.home.plansTitlePart2}</em>
          </h2>
          <p>{t.home.plansDesc}</p>
          <button className="light-button" onClick={() => navigate('/plans')}>
            {t.home.plansButton} <ArrowIcon size={16} />
          </button>
        </div>
        <div className="banner-circles">
          <span>{t.home.circleRead}</span>
          <span>{t.home.circleDiscover}</span>
          <span>{t.home.circleShare}</span>
        </div>
      </section>
    </>
  );
};
