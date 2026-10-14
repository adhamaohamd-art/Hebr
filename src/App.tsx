import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoadingState } from './components/States';

// Pages
import { HomePage } from './pages/HomePage';
const BrowsePage = lazy(() => import('./pages/BrowsePage').then(m => ({ default: m.BrowsePage })));
const NovelDetailPage = lazy(() => import('./pages/NovelDetailPage').then(m => ({ default: m.NovelDetailPage })));
const ReaderPage = lazy(() => import('./pages/ReaderPage').then(m => ({ default: m.ReaderPage })));
const StorePage = lazy(() => import('./pages/StorePage').then(m => ({ default: m.StorePage })));
const PlansPage = lazy(() => import('./pages/PlansPage').then(m => ({ default: m.PlansPage })));
const LibraryPage = lazy(() => import('./pages/LibraryPage').then(m => ({ default: m.LibraryPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Admin Pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage').then(m => ({ default: m.AdminOverviewPage })));
const AdminNovelsPage = lazy(() => import('./pages/admin/AdminNovelsPage').then(m => ({ default: m.AdminNovelsPage })));
const AdminChaptersPage = lazy(() => import('./pages/admin/AdminChaptersPage').then(m => ({ default: m.AdminChaptersPage })));
const AdminBooksPage = lazy(() => import('./pages/admin/AdminBooksPage').then(m => ({ default: m.AdminBooksPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminPlansCouponsPage = lazy(() => import('./pages/admin/AdminPlansCouponsPage').then(m => ({ default: m.AdminPlansCouponsPage })));
const AdminRatingsPage = lazy(() => import('./pages/admin/AdminRatingsPage').then(m => ({ default: m.AdminRatingsPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

import { AlertCircle, Mail, RefreshCw } from 'lucide-react';

const EmailBanner: React.FC = () => {
  const { user, emailVerified, sendVerificationEmail, reloadUser } = useAuth();
  const { t } = useLanguage();
  const [resending, setResending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  if (!user || emailVerified) return null;

  const handleResend = async () => {
    try {
      setResending(true);
      await sendVerificationEmail();
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Resend verification error:', err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-amber-100/90 border-b border-amber-300 text-amber-950 px-4 py-2 text-xs flex items-center justify-between flex-wrap gap-2 z-20 relative">
      <div className="flex items-center gap-2">
        <AlertCircle size={15} className="text-amber-700 shrink-0" />
        <span>{t.common.verifyEmailNotice} <strong className="font-mono">({user.email})</strong></span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleResend}
          disabled={resending}
          className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs flex items-center gap-1 transition"
        >
          <Mail size={12} />
          {resending ? t.common.loading : sent ? t.common.verifyEmailSentSuccess : t.common.verifyEmailResendBtn}
        </button>
        <button
          onClick={() => reloadUser()}
          className="p-1 border border-amber-400 hover:bg-amber-200 text-amber-900 rounded text-xs"
          title="تحديث حالة التفعيل / Refresh status"
          aria-label="Refresh verification status"
        >
          <RefreshCw size={12} />
        </button>
      </div>
    </div>
  );
};

const AppShell: React.FC = () => {
  const { rtl } = useLanguage();
  const { isAdmin } = useAuth();
  const location = useLocation();

  const isReaderPage = location.pathname.includes('/chapter/');
  const isAdminPage = location.pathname.startsWith('/admin') && isAdmin;

  return (
    <div className={`app-shell ${rtl ? 'rtl' : 'ltr'}`} dir={rtl ? 'rtl' : 'ltr'}>
      {/* Global verification notice for signed-in users */}
      <EmailBanner />

      {/* Hide main header on reader and admin pages to preserve focused layout */}
      {!isReaderPage && !isAdminPage && <Header />}

      <main>
        <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/novel/:id" element={<NovelDetailPage />} />
          <Route path="/novel/:id/chapter/:n" element={<ReaderPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Nested Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="novels" element={<AdminNovelsPage />} />
            <Route path="chapters" element={<AdminChaptersPage />} />
            <Route path="books" element={<AdminBooksPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="plans-coupons" element={<AdminPlansCouponsPage />} />
            <Route path="ratings" element={<AdminRatingsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Generic 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </main>

      {/* Hide footer on reader and admin */}
      {!isReaderPage && !isAdminPage && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
