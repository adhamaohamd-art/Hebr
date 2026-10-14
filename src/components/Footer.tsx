import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="brand-mark">
          <BookOpen size={20} />
        </span>
        <b>{t.common.brandName}</b>
        <p>{t.footer.brandQuote}</p>
      </div>
      <div>
        <span className="footer-label">{t.footer.exploreTitle}</span>
        <Link to="/browse">{t.common.browse}</Link>
        <Link to="/store">{t.common.store}</Link>
        <Link to="/plans">{t.common.plans}</Link>
      </div>
      <div>
        <span className="footer-label">{t.footer.helpTitle}</span>
        <Link to="/library">{t.common.library}</Link>
        <Link to="/cart">{t.common.cart}</Link>
      </div>
      <div className="footer-end">
        <span>{t.footer.followTitle}</span>
        <div className="socials">
          <span>ig</span>
          <span>tw</span>
          <span>in</span>
        </div>
        <small>© {new Date().getFullYear()} {t.footer.allRightsReserved}</small>
      </div>
    </footer>
  );
};
