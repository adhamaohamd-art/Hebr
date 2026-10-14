import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { useLanguage } from '../context/LanguageContext';

export const NotFoundPage: React.FC = () => {
  const { t, rtl } = useLanguage();
  const ArrowIcon = rtl ? ArrowLeft : ArrowRight;

  return (
    <div
      className="page-container"
      style={{
        minHeight: '65vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PageMeta
        title={t.notFound.pageTitle}
        description={t.notFound.pageMetaDesc}
      />

      <div className="p-10 bg-white border border-[var(--line)] text-center max-w-md w-full shadow-sm">
        <span className="font-serif text-6xl text-[var(--bronze)] block mb-3 font-semibold">
          {t.notFound.errorCode}
        </span>
        <h1 className="font-serif text-2xl font-medium mb-3">{t.notFound.heading}</h1>
        <p className="text-xs text-[var(--muted)] leading-relaxed mb-8">
          {t.notFound.desc}
        </p>

        <Link to="/" className="primary-button inline-flex">
          <BookOpen size={16} /> {t.notFound.backHomeBtn} <ArrowIcon size={16} />
        </Link>
      </div>
    </div>
  );
};
