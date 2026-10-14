import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  action?: string;
  actionLink?: string;
  onAction?: () => void;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  eyebrow,
  title,
  action,
  actionLink,
  onAction,
}) => {
  const { rtl } = useLanguage();
  const Icon = rtl ? ArrowLeft : ArrowRight;

  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action && (
        actionLink ? (
          <Link to={actionLink} className="text-button">
            {action}
            <Icon size={15} />
          </Link>
        ) : (
          <button className="text-button" onClick={onAction}>
            {action}
            <Icon size={15} />
          </button>
        )
      )}
    </div>
  );
};
