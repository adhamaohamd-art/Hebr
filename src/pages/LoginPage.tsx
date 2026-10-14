import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LIMITS } from '../config';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Only same-site paths are allowed as redirect target (blocks //evil.com style open redirects)
  const rawRedirect = searchParams.get('redirect') || '/library';
  const redirectPath = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/library';

  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { t, rtl } = useLanguage();

  // Already signed in (e.g. after a refresh): go straight to where the user wanted to be.
  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [authLoading, user, redirectPath, navigate]);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ArrowIcon = rtl ? ArrowLeft : ArrowRight;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError(t.login.errNameRequired);
          setLoading(false);
          return;
        }
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      navigate(redirectPath);
    } catch (err: unknown) {
      const authErr = err as { code?: string };
      if (import.meta.env.DEV) {
        console.warn('Auth error:', err);
      }
      if (
        authErr?.code === 'auth/user-not-found' ||
        authErr?.code === 'auth/wrong-password' ||
        authErr?.code === 'auth/invalid-credential'
      ) {
        setError(t.login.errInvalidCreds);
      } else if (authErr?.code === 'auth/email-already-in-use') {
        setError(t.login.errEmailInUse);
      } else if (authErr?.code === 'auth/weak-password') {
        setError(t.login.errWeakPassword);
      } else if (authErr?.code === 'auth/popup-closed-by-user') {
        setError(t.login.errPopupClosed);
      } else {
        setError(t.login.errGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate(redirectPath);
    } catch (err: unknown) {
      const authErr = err as { code?: string };
      console.warn('Google sign in error:', err);
      if (authErr?.code === 'auth/popup-closed-by-user') {
        setError(t.login.errPopupClosed);
      } else if (authErr?.code === 'auth/unauthorized-domain') {
        setError(t.login.errUnauthorizedDomain);
      } else if (authErr?.code === 'auth/operation-not-allowed') {
        setError(t.login.errOperationNotAllowed);
      } else if (authErr?.code === 'auth/popup-blocked') {
        setError(t.login.errPopupBlocked);
      } else if (
        authErr?.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
        authErr?.code === 'auth/invalid-api-key'
      ) {
        setError(t.login.errInvalidApiKey);
      } else {
        setError(`${t.login.errGeneric} (${authErr?.code || 'unknown'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '480px', margin: 'auto', minHeight: '80vh' }}>
      <PageMeta
        title={mode === 'signin' ? t.login.tabSignIn : t.login.tabSignUp}
        description={t.login.pageMetaDesc}
      />

      <div className="bg-white border border-[var(--line)] p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-[var(--green)] text-white flex items-center justify-center rounded-none clip-path">
            <BookOpen size={24} />
          </div>
          <h1 className="font-serif text-3xl font-medium mb-2">
            {mode === 'signin' ? t.login.titleSignIn : t.login.titleSignUp}
          </h1>
          <p className="text-xs text-[var(--muted)]">
            {mode === 'signin' ? t.login.descSignIn : t.login.descSignUp}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-800 text-xs border border-red-200 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 p-3 border border-[var(--line)] bg-white hover:bg-stone-50 text-xs font-medium transition mb-6"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {t.login.googleBtn}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span className="flex-1 h-[1px] bg-[var(--line)]" />
          <span className="text-[11px] text-[var(--muted)]">{t.login.orDivider}</span>
          <span className="flex-1 h-[1px] bg-[var(--line)]" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4 text-start">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                {t.login.nameLabel}
              </label>
              <input
                type="text"
                value={name}
                maxLength={LIMITS.displayNameMax}
                onChange={e => setName(e.target.value)}
                placeholder={t.login.namePlaceholder}
                required
                className="w-full p-2.5 text-xs border border-[var(--line)] bg-white outline-none focus:border-[var(--green)]"
              />
              <span className="text-[10px] text-[var(--muted)] block text-end mt-0.5">
                <bdi dir="ltr">{name.length} / {LIMITS.displayNameMax}</bdi>
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--ink)] mb-1">
              {t.login.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              maxLength={LIMITS.emailMax}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder}
              required
              className="w-full p-2.5 text-xs border border-[var(--line)] bg-white outline-none focus:border-[var(--green)]"
            />
            <span className="text-[10px] text-[var(--muted)] block text-end mt-0.5">
              <bdi dir="ltr">{email.length} / {LIMITS.emailMax}</bdi>
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--ink)] mb-1">
              {t.login.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              maxLength={LIMITS.passwordMax}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.login.passwordPlaceholder}
              required
              minLength={6}
              className="w-full p-2.5 text-xs border border-[var(--line)] bg-white outline-none focus:border-[var(--green)]"
            />
            <span className="text-[10px] text-[var(--muted)] block text-end mt-0.5">
              <bdi dir="ltr">{password.length} / {LIMITS.passwordMax}</bdi>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full mt-2"
          >
            {loading ? (
              t.login.submittingBtn
            ) : mode === 'signin' ? (
              <>
                {t.login.signInBtn} <ArrowIcon size={16} />
              </>
            ) : (
              <>
                {t.login.signUpBtn} <ArrowIcon size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-[var(--line)] text-xs text-[var(--muted)]">
          {mode === 'signin' ? (
            <p>
              {rtl ? 'ليس لديك حساب بعد؟' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-[var(--green)] font-semibold hover:underline mx-1"
              >
                {t.login.tabSignUp}
              </button>
            </p>
          ) : (
            <p>
              {rtl ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-[var(--green)] font-semibold hover:underline mx-1"
              >
                {t.login.tabSignIn}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
