import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Feather,
  ShoppingBag,
  Zap,
  UserRound,
  Sparkles,
  Star,
  Settings,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Globe2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PageMeta } from '../../components/PageMeta';
import { NotFoundPage } from '../NotFoundPage';
import { novelService } from '../../services/novelService';

export const AdminLayout: React.FC = () => {
  const { user, profile, isAdmin, loading } = useAuth();
  const { t, language, toggleLanguage, rtl } = useLanguage();
  const navigate = useNavigate();
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildNotice, setRebuildNotice] = useState<{ success: boolean; msg: string } | null>(null);

  const ViewArrow = rtl ? ArrowLeft : ArrowRight;

  const navItems = [
    { to: '/admin', end: true, label: t.admin.navOverview, icon: LayoutDashboard },
    { to: '/admin/novels', label: t.admin.navNovels, icon: BookOpen },
    { to: '/admin/chapters', label: t.admin.navChapters, icon: Feather },
    { to: '/admin/books', label: t.admin.navBooks, icon: ShoppingBag },
    { to: '/admin/orders', label: t.admin.navOrders, icon: Zap },
    { to: '/admin/users', label: t.visitorManagement.tabVisitors, icon: UserRound },
    { to: '/admin/plans-coupons', label: t.admin.navPlansCoupons, icon: Sparkles },
    { to: '/admin/ratings', label: t.admin.navRatings, icon: Star },
    { to: '/admin/settings', label: t.admin.navSettings, icon: Settings },
  ];

  const executeRebuildCatalog = async () => {
    try {
      setRebuilding(true);
      const res = await novelService.rebuildCatalogAndSummaries();
      setRebuildNotice({ success: res.success, msg: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.admin.rebuildCatalogError;
      setRebuildNotice({ success: false, msg });
    } finally {
      setRebuilding(false);
      setTimeout(() => setRebuildNotice(null), 6000);
    }
  };

  if (loading) {
    return null;
  }

  // Not an admin: render generic 404 page with ZERO admin hints or disclosures
  if (!isAdmin) {
    return <NotFoundPage />;
  }

  return (
    <div className={`admin-page ${rtl ? 'rtl' : 'ltr'}`} dir={rtl ? 'rtl' : 'ltr'}>
      <PageMeta title={t.common.admin} />

      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="drawer-brand">
          <span className="brand-mark">
            <BookOpen size={21} />
          </span>
          <b>{t.common.brandName}</b>
        </div>
        <span className="admin-label">{t.admin.sidebarHeader}</span>

        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon size={17} />
              {item.label}
            </NavLink>
          );
        })}

        <div className="admin-sidebar-bottom space-y-2">
          <button
            onClick={executeRebuildCatalog}
            disabled={rebuilding}
            className="w-full flex items-center justify-center gap-2 p-2 bg-[#2d5047] hover:bg-[#396257] text-white text-xs border border-[rgba(255,255,255,0.15)] transition"
            title={t.admin.rebuildCatalogBtn}
          >
            <RefreshCw size={13} className={rebuilding ? 'animate-spin' : ''} />
            {rebuilding ? t.admin.rebuildingCatalogBtn : t.admin.rebuildCatalogBtn}
          </button>
          <span>{t.admin.liveSystemLabel}</span>
          <b>Firestore · {t.common.brandName}</b>
        </div>
      </aside>

      {/* Admin Main Content */}
      <section className="admin-content">
        <div className="admin-topbar">
          <div>
            <span className="eyebrow">{t.common.admin}</span>
            <h1>{t.admin.portalTitle}</h1>
          </div>

          <div className="admin-actions">
            {/* Language switcher */}
            <button
              className="language-button"
              onClick={toggleLanguage}
              title={t.common.switchLanguage}
              aria-label={t.common.switchLanguage}
            >
              <Globe2 size={14} />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="text-xs text-[var(--muted)] hover:text-black flex items-center gap-1.5"
            >
              <span>{t.admin.viewAsReader}</span>
              <ViewArrow size={14} />
            </button>

            <div className="profile-chip">
              <span>{profile?.name ? profile.name[0] : (language === 'ar' ? 'م' : 'A')}</span>
              <b>{profile?.name || user?.email?.split('@')[0]}</b>
              <ChevronDown size={15} />
            </div>
          </div>
        </div>

        {rebuildNotice && (
          <div
            className={`mb-6 p-4 border text-xs flex items-center justify-between ${
              rebuildNotice.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            <span>{rebuildNotice.msg}</span>
            <button
              onClick={() => setRebuildNotice(null)}
              className="text-xs font-bold underline"
            >
              {t.common.close}
            </button>
          </div>
        )}

        {/* Nested page view */}
        <Outlet />
      </section>
    </div>
  );
};
