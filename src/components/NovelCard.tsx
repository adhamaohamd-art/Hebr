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
            {ratingSummary.hasRatings && (
              <span
                className={`rating text-xs flex items-center gap-1 ${
                  ratingSummary.isEditorial ? 'text-amber-800 font-semibold' : 'text-amber-600'
                }`}
                title={ratingSummary.isEditorial ? t.novelReviews.editorialRatingBadge : ''}
              >
                <span>★ {ratingSummary.displayAverage}</span>
                {ratingSummary.isCombined && (
                  <span className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-sans font-medium">
                    {language === 'ar' ? `مدمج (${ratingSummary.totalCount})` : `Combined (${ratingSummary.totalCount})`}
                  </span>
                )}
                {ratingSummary.isEditorial && (
                  <span className="text-[9px] bg-amber-700 text-white px-1 py-0.2 rounded font-sans">
                    {language === 'ar' ? 'تحرير' : 'Editorial'}
                  </span>
                )}
                {ratingSummary.isCustom && (
                  <span className="text-[9px] bg-stone-200 text-stone-800 px-1 py-0.2 rounded font-sans">
                    {language === 'ar' ? 'مخصص' : 'Custom'}
                  </span>
                )}
                {ratingSummary.isVisitorOnly && ratingSummary.visitorCount > 0 && (
                  <span className="text-[10px] text-[var(--muted)] font-normal">
                    ({ratingSummary.visitorCount})
                  </span>
                )}
              </span>
            )}
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
