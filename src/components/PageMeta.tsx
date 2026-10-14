import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface PageMetaProps {
  title: string;
  description?: string;
}

export const PageMeta: React.FC<PageMetaProps> = ({ title, description }) => {
  const { t } = useLanguage();

  useEffect(() => {
    const fullTitle = `${title} | ${t.common.brandName}`;
    document.title = fullTitle;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description, t.common.brandName]);

  return null;
};
