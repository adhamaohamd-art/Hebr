import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { getFriendlyErrorMessage } from '../lib/firebase';
import { settingsService } from '../services/settingsService';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Plan } from '../types';
import { getLocalizedPlan } from '../i18n/translations';

export const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t, language, rtl } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [loadError, setLoadError] = useState('');

  const ArrowIcon = rtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        const data = await settingsService.getPlans();
        setPlans(data.filter(p => p.active !== false));
        setLoadError('');
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Error loading plans:', err);
        setLoadError(getFriendlyErrorMessage(err, language));
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, [language]);

  const handleSelectPlan = (plan: Plan) => {
    const localized = getLocalizedPlan(plan, language);
    const price = yearly ? plan.priceYearly : plan.priceMonthly;
    addToCart({
      id: `plan_${plan.id}_${yearly ? 'yearly' : 'monthly'}`,
      type: 'plan',
      refId: plan.id,
      title: `${t.home.plansEyebrow} - ${localized.name} (${yearly ? t.plans.yearly : t.plans.monthly})`,
      price,
      period: yearly ? 'yearly' : 'monthly',
    });
    navigate('/cart');
  };

  return (
    <div className="page-container plans-page">
      <PageMeta
        title={t.plans.pageTitle}
        description={t.plans.pageMetaDesc}
      />

      <div className="center-heading">
        <span className="eyebrow">{t.plans.eyebrow}</span>
        <h1>{t.plans.title}</h1>
        <p>{t.plans.subtitle}</p>

        <div className="billing-toggle">
          <button className={!yearly ? 'active' : ''} onClick={() => setYearly(false)}>
            {t.plans.monthly}
          </button>
          <button className={yearly ? 'active' : ''} onClick={() => setYearly(true)}>
            {t.plans.yearly} <span>{t.plans.saveTwoMonths}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState message={t.plans.loadingMessage} />
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={() => window.location.reload()} />
      ) : plans.length === 0 ? (
        <EmptyState
          title={language === 'ar' ? 'لا توجد خطط اشتراك متاحة حالياً' : 'No subscription plans available yet'}
          description={language === 'ar' ? 'سيتم إضافة الخطط قريباً.' : 'Plans will be added soon.'}
        />
      ) : (
        <div className="plans-grid">
          {plans.map(plan => {
            const localized = getLocalizedPlan(plan, language);
            const currentPrice = yearly ? plan.priceYearly : plan.priceMonthly;
            return (
              <article
                className={`plan-card ${plan.featured ? 'featured' : ''}`}
                key={plan.id}
              >
                {plan.featured && <span className="plan-badge">{t.plans.mostChosenBadge}</span>}
                <span className="eyebrow">{t.plans.planPrefix} {localized.name}</span>
                <h2>
                  {currentPrice}
                  <small> {yearly ? t.plans.perYear : t.plans.perMonth}</small>
                </h2>
                <p>{localized.description}</p>
                <div className="plan-rule" />
                <span className="included-label">{t.plans.includesAccessTo}</span>
                {(plan.writerNovelLimit ?? 0) > 0 && (
                  <span className="included">
                    <Check size={14} />
                    {language === 'ar'
                      ? `حساب كاتب: اكتب وانشر حتى ${plan.writerNovelLimit} روايات`
                      : `Writer account: write and publish up to ${plan.writerNovelLimit} novels`}
                  </span>
                )}
                {localized.books.map(book => (
                  <span className="included" key={book}>
                    <Check size={14} />
                    {book}
                  </span>
                ))}
                <button
                  className={plan.featured ? 'primary-button' : 'outline-button'}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {t.plans.selectPlanBtn} <ArrowIcon size={15} />
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="subscription-note">
        <Sparkles size={18} />
        <span>{t.plans.paymentNote}</span>
      </div>
    </div>
  );
};
