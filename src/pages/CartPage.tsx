import React, { useState } from 'react';
import { ShoppingBag, X, ArrowLeft, ArrowRight, Tag, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Cover } from '../components/Cover';
import { PageMeta } from '../components/PageMeta';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { orderService } from '../services/orderService';
import { LIMITS } from '../config';
import { couponAppliesToItem } from '../lib/couponScope';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, rtl } = useLanguage();
  const {
    cart,
    removeFromCart,
    subtotal,
    discount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const ArrowIcon = rtl ? ArrowLeft : ArrowRight;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setValidatingCoupon(true);
    setCouponMsg(null);
    const result = await orderService.validateCoupon(couponInput);
    setValidatingCoupon(false);

    if (result.valid && result.coupon && result.coupon.novelId && !cart.some(i => couponAppliesToItem(result.coupon, i))) {
      setCouponMsg({
        type: 'error',
        text: 'هذا الكوبون خاص برواية معيّنة وليست في سلتك. أضف تلك الرواية أو كتابها الرقمي أولًا.',
      });
      return;
    }

    if (result.valid && result.coupon) {
      applyCoupon(result.coupon);
      setCouponMsg({
        type: 'success',
        text: `${t.cart.couponAppliedSuccess}: ${result.coupon.value}${result.coupon.type === 'percent' ? t.common.percentOff : ` ${t.common.currency}`}`,
      });
      setCouponInput('');
    } else {
      setCouponMsg({ type: 'error', text: result.error || t.cart.couponInvalidError });
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="page-container cart-page">
      <PageMeta
        title={t.cart.pageTitle}
        description={t.cart.pageMetaDesc}
      />

      <div className="page-heading compact">
        <div>
          <span className="eyebrow">{t.cart.eyebrow}</span>
          <h1>{t.cart.title}</h1>
          <p>{t.cart.subtitle}</p>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state cart-empty">
          <ShoppingBag size={35} />
          <h3>{t.cart.emptyTitle}</h3>
          <p>{t.cart.emptyDesc}</p>
          <button className="primary-button" onClick={() => navigate('/browse')}>
            {t.cart.exploreNovelsBtn} <ArrowIcon size={16} />
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map(item => (
              <div className="cart-item" key={item.id}>
                <div className="w-16">
                  <Cover
                    novel={{
                      title: item.title,
                      author: item.author || t.common.brandName,
                      genre: item.type === 'plan' ? t.home.plansEyebrow : t.common.genre,
                      color: item.coverColor || '#23483f',
                      accent: item.coverAccent || '#d9bb91',
                    }}
                  />
                </div>
                <div>
                  <span className="eyebrow">
                    {item.type === 'novel'
                      ? t.cart.itemNovelLabel
                      : item.type === 'book'
                      ? t.cart.itemBookLabel
                      : t.cart.itemPlanLabel}
                  </span>
                  <h3>{item.title}</h3>
                  {item.author && <p>{item.author}</p>}
                </div>
                <strong>{item.price} {t.common.currency}</strong>
                <button
                  className="remove-button"
                  onClick={() => removeFromCart(item.id)}
                  title={t.cart.removeItemTooltip}
                  aria-label={t.cart.removeItemTooltip}
                >
                  <X size={17} />
                </button>
              </div>
            ))}
          </div>

          <aside className="summary-card">
            <span className="eyebrow">{t.cart.summaryEyebrow}</span>

            {/* Coupon field */}
            <div className="flex flex-col gap-2 pb-4">
              <form onSubmit={handleApplyCoupon} className="flex gap-2 w-full">
                <input
                  type="text"
                  value={couponInput}
                  maxLength={LIMITS.couponCodeMax}
                  onChange={e => setCouponInput(e.target.value)}
                  placeholder={t.cart.couponPlaceholder}
                  className="flex-1 p-2 text-xs border border-[var(--line)] uppercase outline-none focus:border-[var(--green)] bg-white"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon}
                  className="outline-button small shrink-0"
                >
                  <Tag size={13} /> {validatingCoupon ? t.cart.checkingCoupon : t.cart.checkCouponBtn}
                </button>
              </form>
              <span className="text-[10px] text-[var(--muted)] text-end">
                <bdi dir="ltr">{couponInput.length} / {LIMITS.couponCodeMax}</bdi>
              </span>

              {couponMsg && (
                <div
                  className={`text-xs p-2 flex items-center gap-1.5 ${
                    couponMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {couponMsg.type === 'success' ? (
                    <Check size={13} />
                  ) : (
                    <AlertCircle size={13} />
                  )}
                  {couponMsg.text}
                </div>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                  <span>{t.cart.appliedCouponPrefix} {appliedCoupon.code}</span>
                  <button
                    onClick={removeCoupon}
                    className="text-red-500 hover:underline"
                  >
                    {t.cart.removeCouponBtn}
                  </button>
                </div>
              )}
            </div>

            <div>
              <span>{t.cart.subtotalLabel}</span>
              <b>{subtotal} {t.common.currency}</b>
            </div>

            {discount > 0 && (
              <div className="text-emerald-700">
                <span>{t.cart.couponDiscountLabel}</span>
                <b>- {discount} {t.common.currency}</b>
              </div>
            )}

            <div className="summary-total">
              <span>{t.cart.totalLabel}</span>
              <b>{total} {t.common.currency}</b>
            </div>

            <button className="primary-button" onClick={handleCheckout}>
              {t.cart.proceedCheckoutBtn} <ArrowIcon size={16} />
            </button>

            <small>
              {t.cart.paymentMethodsHint}
            </small>
          </aside>
        </div>
      )}
    </div>
  );
};
