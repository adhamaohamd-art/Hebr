import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Novel } from '../types';
import { Cover } from './Cover';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { libraryService } from '../services/libraryService';
import { getLocalizedNovelField } from '../i18n/translations';
import { getNovelRatingSummary } from '../lib/rating';

interface NovelCardProps {
  novel: Novel;
  compact?: boolean;
}

export const NovelCard: React.FC<NovelCardProps> = ({ novel, compact = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [bookmarked, setBookmarked] = useState(false);

  const title = getLocalizedNovelField(novel, 'title', language);
  const author = getLocalizedNovelField(novel, 'author', language);
  const genre = getLocalizedNovelField(novel, 'genre', language);
  const statusLabel = t.statusLabels[novel.status] || novel.status;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    const nextState = !bookmarked;
    setBookmarked(nextState);
    await libraryService.updateLibraryProgress(user.uid, novel.id, {
      bookmarked: nextState,
    });
  };

  const ratingSummary = getNovelRatingSummary(novel);


  return (
    <article
      className={`novel-card ${compact ? 'novel-card-compact' : ''}`}
      onClick={() => navigate(`/novel/${novel.id}`)}
    >
      <div className="card-cover-wrap">
        <Cover novel={novel} />
        <button
          className="save-button"
          onClick={handleBookmark}
          aria-label={t.reader.bookmarkTooltip}
          title={t.reader.bookmarkTooltip}
        >
          <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="card-meta">
        <span>{genre}</span>
        <span>{statusLabel}</span>
      </div>
      <h3>{title}</h3>
      <p>{author}</p>
      {!compact && (
        <div className="card-bottom">
          <span>{novel.chaptersCount} {t.common.chaptersCount}</span>
          <div className="flex items-center gap-2">
            <span
              className="rating inline-flex items-center gap-1.5 text-xs"
              aria-label={ratingSummary.hasRatings
                ? `${ratingSummary.displayAverage} / 5, ${ratingSummary.visitorCount} ${language === 'ar' ? 'تقييم' : 'ratings'}`
                : (language === 'ar' ? 'لا توجد تقييمات بعد' : 'No ratings yet')}
              title={ratingSummary.hasRatings
                ? `${ratingSummary.displayAverage} / 5`
                : (language === 'ar' ? 'لا توجد تقييمات بعد' : 'No ratings yet')}
            >
              <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={ratingSummary.hasRatings && star <= Math.round(ratingSummary.average || 0)
                      ? 'text-amber-500'
                      : 'text-stone-300'}
                  >
                    ★
                  </span>
                ))}
              </span>
              <span className="font-semibold text-stone-700">
                {ratingSummary.hasRatings ? ratingSummary.displayAverage : '—'}
              </span>
              <span className="text-[10px] text-[var(--muted)]">
                ({ratingSummary.visitorCount})
              </span>
            </span>
            {novel.novelPrice ? (
              <span className="font-semibold text-[var(--green)]">
                {novel.novelPrice} {t.common.currency}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
};
