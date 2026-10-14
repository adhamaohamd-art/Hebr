import React from 'react';
import { Feather } from 'lucide-react';
import { Novel } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedNovelField } from '../i18n/translations';

interface CoverProps {
  novel: Pick<Novel, 'title' | 'titleEn' | 'author' | 'authorEn' | 'genre' | 'genreEn' | 'color' | 'accent' | 'coverUrl'>;
  large?: boolean;
}

export const Cover: React.FC<CoverProps> = ({ novel, large = false }) => {
  const { language } = useLanguage();

  const title = getLocalizedNovelField(novel, 'title', language);
  const author = getLocalizedNovelField(novel, 'author', language);
  const genre = getLocalizedNovelField(novel, 'genre', language);

  if (novel.coverUrl) {
    return (
      <div
        className={`cover ${large ? 'cover-large' : ''}`}
        style={{
          backgroundImage: `url(${novel.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="cover-lines" />
        <span className="cover-title" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
          {title}
        </span>
        <span className="cover-author" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
          {author}
        </span>
        <span className="cover-rule" />
        <span className="cover-genre">{genre}</span>
      </div>
    );
  }

  const bgColor = novel.color || '#314f49';
  const accentColor = novel.accent || '#d9bb91';

  return (
    <div
      className={`cover ${large ? 'cover-large' : ''}`}
      style={{ background: `linear-gradient(145deg, ${bgColor}, #1d2a29)` }}
    >
      <div className="cover-glow" style={{ background: accentColor }} />
      <div className="cover-lines" />
      <span className="cover-mark">
        <Feather size={large ? 30 : 18} strokeWidth={1.4} />
      </span>
      <span className="cover-title">{title}</span>
      <span className="cover-author">{author}</span>
      <span className="cover-rule" style={{ background: accentColor }} />
      <span className="cover-genre">{genre}</span>
    </div>
  );
};
