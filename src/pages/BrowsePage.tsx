import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronDown, Feather } from 'lucide-react';
import { NovelCard } from '../components/NovelCard';
import { PageMeta } from '../components/PageMeta';
import { LoadingState, EmptyState, ErrorState } from '../components/States';
import { getFriendlyErrorMessage } from '../lib/firebase';
import { novelService } from '../services/novelService';
import { Novel } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LIMITS } from '../config';
import { GENRE_KEYS, novelHasGenre } from '../lib/genres';

const canonicalGenres = ['الكل', ...GENRE_KEYS];
const canonicalStatuses = ['الكل', 'مستمرة', 'مكتملة'];

export const BrowsePage: React.FC = () => {
  const { t, language } = useLanguage();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('الكل');
  const [status, setStatus] = useState('الكل');

  useEffect(() => {
    async function fetchNovels() {
      try {
        setLoading(true);
        setLoadError('');
        const data = await novelService.getNovels({ publishedOnly: true });
        setNovels(data);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Error fetching novels:', err);
        setLoadError(getFriendlyErrorMessage(err, language));
      } finally {
        setLoading(false);
      }
    }
    fetchNovels();
  }, [reloadKey, language]);

  const filteredNovels = useMemo(() => {
    return novels.filter(novel => {
      const q = query.toLowerCase().trim();
      const matchesQuery = !q || (
        novel.title.toLowerCase().includes(q) ||
        (novel.titleEn && novel.titleEn.toLowerCase().includes(q)) ||
        novel.author.toLowerCase().includes(q) ||
        (novel.authorEn && novel.authorEn.toLowerCase().includes(q)) ||
        novel.description.toLowerCase().includes(q) ||
        (novel.descriptionEn && novel.descriptionEn.toLowerCase().includes(q))
      );
      const matchesGenre = genre === 'الكل' || novelHasGenre(novel, genre);
      const matchesStatus = status === 'الكل' || novel.status === status;
      return matchesQuery && matchesGenre && matchesStatus;
    });
  }, [novels, query, genre, status]);

  return (
    <div className="page-container">
      <PageMeta
        title={t.browse.pageTitle}
        description={t.browse.pageMetaDesc}
      />

      <div className="page-heading">
        <div>
          <span className="eyebrow">{t.browse.eyebrow}</span>
          <h1>{t.browse.title}</h1>
          <p>{t.browse.intro}</p>
        </div>
        <div className="heading-aside">
          <Feather size={32} />
          <span>{t.browse.asideTagline}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="browse-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            maxLength={LIMITS.searchMax}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.common.searchPlaceholder}
          />
          <span className="text-[10px] text-[var(--muted)] shrink-0 font-mono">
            {query.length}/{LIMITS.searchMax}
          </span>
        </label>

        <div className="filter-select">
          <Filter size={16} />
          <select value={status} onChange={e => setStatus(e.target.value)}>
            {canonicalStatuses.map(s => (
              <option key={s} value={s}>
                {t.statusLabels[s] || s}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </div>

        <span className="result-count">
          {filteredNovels.length} {filteredNovels.length === 1 ? t.browse.novelsCountSingle : t.browse.novelsCountPlural}
        </span>
      </div>

      {/* Genres Chips */}
      <div className="chip-row">
        {canonicalGenres.map(item => {
          const displayLabel = t.genres[item] || item;
          return (
            <button
              key={item}
              className={genre === item ? 'selected' : ''}
              onClick={() => setGenre(item)}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>

      {/* Grid or Empty */}
      {loading ? (
        <LoadingState message={t.browse.loadingMessage} />
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={() => setReloadKey(k => k + 1)} />
      ) : filteredNovels.length > 0 ? (
        <div className="browse-grid">
          {filteredNovels.map(novel => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t.browse.emptyTitle}
          description={t.browse.emptyDesc}
          actionText={t.browse.resetFilters}
          onAction={() => {
            setQuery('');
            setGenre('الكل');
            setStatus('الكل');
          }}
        />
      )}
    </div>
  );
};
