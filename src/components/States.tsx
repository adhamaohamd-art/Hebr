import React from 'react';
import { Feather, RefreshCw, AlertCircle, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LoadingState: React.FC<{ message?: string }> = ({ message }) => {
  const { t, language } = useLanguage();
  const defaultMsg = t.common.loading;
  const subMsg = language === 'ar' ? 'لحظات قليلة وتكتمل الصفحة' : 'Just a moment, loading content...';

  return (
    <div className="empty-state" style={{ minHeight: '320px' }}>
      <div className="animate-spin text-[var(--bronze)] mb-4">
        <Feather size={32} />
      </div>
      <h3 className="text-lg font-medium">{message || defaultMsg}</h3>
      <p className="text-xs text-[var(--muted)]">{subMsg}</p>
    </div>
  );
};

export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => {
  const { t } = useLanguage();
  const defaultTitle = t.browse.emptyTitle;
  const defaultDesc = t.browse.emptyDesc;

  return (
    <div className="empty-state">
      <Search size={32} />
      <h3>{title || defaultTitle}</h3>
      <p>{description || defaultDesc}</p>
      {actionText && onAction && (
        <button className="primary-button small" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  error?: string;
  onRetry?: () => void;
}> = ({ title, error, onRetry }) => {
  const { t, language } = useLanguage();
  const defaultTitle = t.common.error;
  const defaultErr = language === 'ar'
    ? 'حدث خطأ أثناء الاتصال بقاعدة البيانات. يرجى إعادة المحاولة.'
    : 'An error occurred while connecting. Please try again.';
  const retryLabel = language === 'ar' ? 'إعادة المحاولة' : 'Try Again';

  return (
    <div className="empty-state" style={{ borderColor: '#e4b6b6' }}>
      <AlertCircle size={32} color="#b34040" />
      <h3 style={{ color: '#882222' }}>{title || defaultTitle}</h3>
      <p>{error || defaultErr}</p>
      {onRetry && (
        <button className="outline-button small" onClick={onRetry}>
          <RefreshCw size={14} /> {retryLabel}
        </button>
      )}
    </div>
  );
};
