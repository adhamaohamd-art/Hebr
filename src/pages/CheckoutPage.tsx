import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Wallet,
  Check,
  FileText,
  Phone,
  Hash,
  Mail,
} from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { LoadingState } from '../components/States';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { orderService } from '../services/orderService';
import { settingsService, defaultSettings } from '../services/settingsService';
import { isValidEgyptianPhone, isValidTransactionRef } from '../lib/sanitize';
import { LIMITS } from '../config';
import { PaymentMethod, SiteSettings } from '../types';

/** Arabic-Indic digits (٠١٢٣…) -> Latin digits, so Egyptian keyboards produce valid numbers. */
const toLatinDigits = (v: string) => v.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660));

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile, sendVerificationEmail, emailVerified, reloadUser } = useAuth();
  const { cart, total, discount, appliedCoupon, clearCart } = useCart();
  const { t, language, rtl } = useLanguage();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vodafone_cash');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendVerificationSent, setResendVerificationSent] = useState(false);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');

  const BackArrow = rtl ? ArrowRight : ArrowLeft;
  const ForwardArrow = rtl ? ArrowLeft : ArrowRight;
  const paymentUnavailable =
    paymentMethod === 'vodafone_cash' ? !settings.vodafoneCashNumber : !settings.instapayHandle;

  const handleCheckVerified = async () => {
    setVerifyChecking(true);
    setVerifyMessage('');
    const ok = await reloadUser();
    setVerifyMessage(ok ? t.common.verifiedCheckSuccess : t.common.verifiedCheckStillNot);
    if (ok) setErrorMsg('');
    setVerifyChecking(false);
  };

  const handleResendVerification = async () => {
    try {
      setResendingVerification(true);
      await sendVerificationEmail();
      setResendVerificationSent(true);
      setTimeout(() => setResendVerificationSent(false), 5000);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Resend verification error:', err);
    } finally {
      setResendingVerification(false);
    }
  };

  useEffect(() => {
    // Wait until Firebase has restored the session; otherwise a refresh sends signed-in users to /login.
    if (authLoading) return;
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (cart.length === 0 && !submittedOrderId) {
      navigate('/cart');
      return;
    }

    async function loadSettings() {
      const s = await settingsService.getSettings();
      setSettings(s);
    }
    loadSettings();
  }, [authLoading, user, cart.length, submittedOrderId, navigate]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!emailVerified) {
      setErrorMsg(t.common.emailNotVerifiedOrder);
      return;
    }

    const trimmedPhone = senderPhone.trim();
    const trimmedRef = transactionRef.trim();

    if (!isValidEgyptianPhone(trimmedPhone)) {
      setErrorMsg(t.checkout.invalidSenderPhone);
      return;
    }

    if (!isValidTransactionRef(trimmedRef)) {
      setErrorMsg(t.checkout.invalidTransactionRef);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const orderItems = cart.map(i => ({
        type: i.type,
        refId: i.refId,
        title: i.title,
        price: i.price,
      }));

      const newOrderId = await orderService.createOrder({
        userId: user.uid,
        userEmail: user.email || '',
        userName: profile?.name || user.displayName || user.email?.split('@')[0],
        items: orderItems,
        total,
        discount,
        couponCode: appliedCoupon?.code || null,
        paymentMethod,
        senderPhone: trimmedPhone,
        transactionRef: trimmedRef,
        note: note.trim().slice(0, 140),
      });

      clearCart();
      await refreshProfile();
      setSubmittedOrderId(newOrderId);
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('Order submission error:', err);
      }
      const code = (err as { code?: string } | null)?.code;
      const msg =
        code === 'permission-denied'
          ? t.checkout.permissionError
          : err instanceof Error
            ? err.message
            : t.checkout.submissionError;
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingState />;
  }

  if (submittedOrderId) {
    return (
      <div className="page-container" style={{ maxWidth: '680px', margin: 'auto' }}>
        <PageMeta title={t.checkout.orderSuccessTitle} description={t.checkout.metaDesc} />

        <div className="p-8 text-center bg-white border border-[var(--line)] shadow-sm">
          <CheckCircle2 size={54} className="mx-auto text-[var(--green)] mb-4" />
          <h1 className="font-serif text-3xl font-medium mb-3">
            {t.checkout.orderSuccessTitle}
          </h1>
          <span className="text-xs font-mono text-[var(--bronze)] block mb-4">
            {t.checkout.orderNumberLabel} #{submittedOrderId.slice(-6).toUpperCase()}
          </span>
          <p className="text-sm text-[var(--muted)] leading-relaxed mb-6">
            {t.checkout.orderSuccessDesc}
          </p>

          <div className="p-4 bg-[var(--paper)] text-xs text-[var(--ink)] mb-8 border border-[var(--line)] space-y-1 text-start">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">{rtl ? 'الحالة الحالية:' : 'Current Status:'}</span>
              <span className="font-semibold text-amber-700">{t.checkout.statusUnderReview}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-[var(--muted)]">{t.checkout.transactionRefLabel}:</span>
              <span>{transactionRef}</span>
            </div>
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/library" className="primary-button">
              {t.checkout.goToLibraryBtn} <ForwardArrow size={16} />
            </Link>
            <Link to="/browse" className="outline-button">
              {t.checkout.continueBrowsingBtn}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '980px', margin: 'auto' }}>
      <PageMeta title={t.checkout.pageTitle} description={t.checkout.metaDesc} />

      <button className="back-button" onClick={() => navigate('/cart')}>
        <BackArrow size={17} /> {t.checkout.backToCart}
      </button>

      <div className="page-heading compact">
        <div>
          <span className="eyebrow">{t.checkout.eyebrow}</span>
          <h1>{t.checkout.title}</h1>
          <p>{t.checkout.subtitle}</p>
        </div>
      </div>

      {/* Email Verification Warning */}
      {user && !emailVerified && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-700 shrink-0" />
            <span>{t.common.emailNotVerifiedOrder}</span>
          </div>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendingVerification}
            className="font-medium underline hover:text-amber-950 flex items-center gap-1"
          >
            <Mail size={13} />
            {resendingVerification
              ? t.common.loading
              : resendVerificationSent
              ? t.common.verifyEmailSentSuccess
              : t.common.verifyEmailResendBtn}
          </button>
          <button
            type="button"
            onClick={handleCheckVerified}
            disabled={verifyChecking}
            className="font-medium underline hover:text-amber-950"
          >
            {verifyChecking ? t.common.verifiedCheckChecking : t.common.verifiedCheckBtn}
          </button>
        </div>
      )}
      {user && verifyMessage && (
        <p className="mb-4 text-xs text-[var(--muted)]" role="status">{verifyMessage}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-start">
        {/* Main Column: Payment Options & Transfer Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Method selector */}
          <div className="p-6 bg-white border border-[var(--line)]">
            <h3 className="font-serif text-xl mb-4 font-medium">{t.checkout.step1Title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                className={`p-4 border text-start transition flex items-center gap-3 ${
                  paymentMethod === 'vodafone_cash'
                    ? 'border-[var(--green)] bg-emerald-50 text-[var(--green)]'
                    : 'border-[var(--line)] hover:border-stone-400'
                }`}
                onClick={() => setPaymentMethod('vodafone_cash')}
              >
                <Smartphone size={22} className="shrink-0" />
                <div>
                  <b className="block text-sm">{t.checkout.vodafoneCashTitle}</b>
                  <small className="text-xs text-[var(--muted)]">
                    {rtl ? 'محفظة إلكترونية' : 'Digital Wallet'}
                  </small>
                </div>
              </button>

              <button
                type="button"
                className={`p-4 border text-start transition flex items-center gap-3 ${
                  paymentMethod === 'instapay'
                    ? 'border-[var(--green)] bg-emerald-50 text-[var(--green)]'
                    : 'border-[var(--line)] hover:border-stone-400'
                }`}
                onClick={() => setPaymentMethod('instapay')}
              >
                <Wallet size={22} className="shrink-0" />
                <div>
                  <b className="block text-sm">{t.checkout.instapayTitle}</b>
                  <small className="text-xs text-[var(--muted)]">
                    {rtl ? 'تحويل لحظي مباشر' : 'Instant Bank Transfer'}
                  </small>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Details Box */}
          <div className="p-6 bg-[#f7f6f0] border border-[var(--line)]">
            <h3 className="font-serif text-xl mb-3 font-medium">{t.checkout.step2Title}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-[var(--line)]">
                <span className="text-[var(--muted)]">{t.checkout.sendAmountPrompt}</span>
                <b className="text-[var(--green)] text-lg">{total} {t.common.currency}</b>
              </div>

              {paymentMethod === 'vodafone_cash' ? (
                <div className="flex justify-between items-center py-2 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">{t.checkout.recipientNumber}</span>
                  <b className="font-mono text-base tracking-wider text-[var(--ink)]">
                    {settings.vodafoneCashNumber}
                  </b>
                </div>
              ) : (
                <div className="flex justify-between items-center py-2 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">{t.checkout.instapayHandle}</span>
                  <b className="font-mono text-base tracking-wider text-[var(--ink)]">
                    {settings.instapayHandle}
                  </b>
                </div>
              )}

              {paymentUnavailable ? (
                <p className="text-xs text-red-700 leading-relaxed pt-2" role="alert">
                  {language === 'ar'
                    ? 'بيانات الدفع لهذه الطريقة غير متاحة حالياً. اختر طريقة أخرى أو حاول لاحقاً.'
                    : 'Payment details for this method are not available right now. Choose another method or try later.'}
                </p>
              ) : (
                <p className="text-xs text-[var(--muted)] leading-relaxed pt-2">
                  {settings.paymentInstructions}
                </p>
              )}
            </div>
          </div>

          {/* Manual Transfer Details Form */}
          <form onSubmit={handleSubmitOrder} className="p-6 bg-white border border-[var(--line)] space-y-4">
            <h3 className="font-serif text-xl mb-3 font-medium">{t.checkout.step3Title}</h3>

            <div>
              <label className="block text-xs font-medium mb-1 flex items-center gap-1.5">
                <Phone size={13} /> {t.checkout.senderPhoneLabel}
              </label>
              <input
                type="tel"
                required
                value={senderPhone}
                maxLength={LIMITS.senderPhoneMax}
                onChange={e => {
                  setSenderPhone(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, LIMITS.senderPhoneMax));
                  setErrorMsg('');
                }}
                placeholder={t.checkout.senderPhonePlaceholder}
                className="w-full p-2.5 border border-[var(--line)] text-sm font-mono"
                dir="ltr"
              />
              <div className="flex justify-between items-center text-[11px] text-[var(--muted)] mt-1">
                <span>{t.checkout.senderPhoneHint}</span>
                <span className="font-mono"><bdi dir="ltr">{senderPhone.length} / {LIMITS.senderPhoneMax}</bdi></span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 flex items-center gap-1.5">
                <Hash size={13} /> {t.checkout.transactionRefLabel}
              </label>
              <input
                type="text"
                required
                value={transactionRef}
                maxLength={LIMITS.transactionRefMax}
                onChange={e => {
                  setTransactionRef(toLatinDigits(e.target.value).replace(/[^A-Za-z0-9-]/g, '').slice(0, LIMITS.transactionRefMax));
                  setErrorMsg('');
                }}
                placeholder={t.checkout.transactionRefPlaceholder}
                className="w-full p-2.5 border border-[var(--line)] text-sm font-mono"
                dir="ltr"
              />
              <div className="flex justify-between items-center text-[11px] text-[var(--muted)] mt-1">
                <span>{t.checkout.transactionRefHint}</span>
                <span className="font-mono"><bdi dir="ltr">{transactionRef.length} / {LIMITS.transactionRefMax}</bdi></span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 flex items-center gap-1.5">
                <FileText size={13} /> {t.checkout.noteLabel}
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 140))}
                placeholder={t.checkout.notePlaceholder}
                rows={2}
                maxLength={140}
                className="w-full p-2.5 border border-[var(--line)] text-xs"
              />
              <span className="text-[11px] text-[var(--muted)] block text-end">
                <bdi dir="ltr">{note.length} / 140</bdi>
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 text-xs border border-red-200 flex items-center gap-2">
                <AlertCircle size={15} /> {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || paymentUnavailable}
              className="primary-button w-full mt-4"
            >
              {loading ? (
                t.checkout.processingBtn
              ) : (
                <>
                  {t.checkout.confirmSubmitBtn} ({total} {t.common.currency}) <Check size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div>
          <div className="p-6 bg-white border border-[var(--line)] sticky top-6">
            <span className="eyebrow">{t.checkout.orderSummaryEyebrow} ({cart.length})</span>
            <div className="space-y-3 my-4 border-b border-[var(--line)] pb-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="truncate max-w-[170px]">{item.title}</span>
                  <b>{item.price} {t.common.currency}</b>
                </div>
              ))}
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 mb-2">
                <span>{t.cart.couponDiscountLabel}</span>
                <b>- {discount} {t.common.currency}</b>
              </div>
            )}

            <div className="flex justify-between text-base font-semibold border-t border-[var(--line)] pt-3 text-[var(--green)]">
              <span>{t.cart.totalLabel}</span>
              <span>{total} {t.common.currency}</span>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--line)] text-[11px] text-[var(--muted)] space-y-1">
              <div>✓ {rtl ? 'مراجعة سريعة لمعاملة التحويل' : 'Quick manual transfer verification'}</div>
              <div>✓ {rtl ? 'تفعيل فوري للصلاحيات بمجرد التأكيد' : 'Immediate reading activation on approval'}</div>
              <div>✓ {rtl ? 'دعم مستمر عبر البريد والموقع' : 'Continuous support anytime'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
