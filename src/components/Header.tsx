import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Globe2,
  CircleUserRound,
  ShoppingBag,
  Menu,
  X,
  LayoutDashboard,
  Library,
  Sparkles,
  Home,
  LogOut,
  Feather,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Header: React.FC = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, profile, isAdmin, logout, writerLimit } = useAuth();
  const { itemsCount } = useCart();
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: t.common.home, icon: Home },
    { to: '/browse', label: t.common.browse, icon: BookOpen },
    { to: '/store', label: t.common.store, icon: ShoppingBag },
    { to: '/plans', label: t.common.plans, icon: Sparkles },
    { to: '/library', label: t.common.library, icon: Library },
  ];

  return (
    <>
      <header className="site-header">
        <button
          className="mobile-trigger"
          onClick={() => setMobileMenu(true)}
          aria-label={t.common.openMenu}
        >
          <Menu size={22} />
        </button>

        <Link to="/" className="brand">
          <span className="brand-mark">
            <BookOpen size={22} />
          </span>
          <span>
            <b>{t.common.brandName}</b>
            <small>{t.common.brandTagline}</small>
          </span>
        </Link>

        <nav className="desktop-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => navigate('/browse')}
            aria-label={t.common.search}
            title={t.common.search}
          >
            <Search size={19} />
          </button>

          <button
            className="language-button"
            onClick={toggleLanguage}
            title={t.common.switchLanguage}
            aria-label={t.common.switchLanguage}
          >
            <Globe2 size={15} />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/library" className="header-account" title={t.common.account}>
                <CircleUserRound size={20} />
                <span>{profile?.name || user.email?.split('@')[0]}</span>
              </Link>
              {writerLimit > 0 && (
                <Link
                  to="/writer"
                  className="icon-button text-[var(--bronze)]"
                  title={language === 'ar' ? 'لوحة الكاتب' : 'Writer studio'}
                  aria-label={language === 'ar' ? 'لوحة الكاتب' : 'Writer studio'}
                >
                  <Feather size={18} />
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="icon-button text-[var(--bronze)]"
                  title={t.common.admin}
                  aria-label={t.common.admin}
                >
                  <LayoutDashboard size={18} />
                </Link>
              )}
              <button
                className="icon-button"
                onClick={logout}
                title={t.common.logout}
                aria-label={t.common.logout}
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="header-account" title={t.common.login}>
              <CircleUserRound size={20} />
              <span>{t.common.login}</span>
            </Link>
          )}

          <Link to="/cart" className="cart-button" aria-label={t.common.cart} title={t.common.cart}>
            <ShoppingBag size={19} />
            <em>{itemsCount}</em>
          </Link>
        </div>
      </header>

      {mobileMenu && (
        <div className="mobile-overlay" onClick={() => setMobileMenu(false)}>
          <aside className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <button
              className="drawer-close"
              onClick={() => setMobileMenu(false)}
              aria-label={t.common.closeMenu}
            >
              <X size={21} />
            </button>
            <div className="drawer-brand">
              <span className="brand-mark">
                <BookOpen size={21} />
              </span>
              <span>
                <b>{t.common.brandName}</b>
              </span>
            </div>

            {/* Mobile language button */}
            <div className="mb-3 pb-3 border-b border-[var(--line)]">
              <button
                className="language-button w-full justify-center"
                onClick={() => {
                  toggleLanguage();
                  setMobileMenu(false);
                }}
              >
                <Globe2 size={15} />
                <span>{language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}</span>
              </button>
            </div>

            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenu(false)}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="mt-4 pt-4 border-t border-[var(--line)]">
              {user ? (
                <div className="space-y-1">
                  {writerLimit > 0 && (
                    <NavLink
                      to="/writer"
                      onClick={() => setMobileMenu(false)}
                      className="w-full flex items-center gap-2 text-sm text-[var(--bronze)] p-2 font-medium"
                    >
                      <Feather size={16} />
                      <span>{language === 'ar' ? 'لوحة الكاتب' : 'Writer studio'}</span>
                    </NavLink>
                  )}
                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      onClick={() => setMobileMenu(false)}
                      className="w-full flex items-center gap-2 text-sm text-[var(--bronze)] p-2 font-medium"
                    >
                      <LayoutDashboard size={16} />
                      <span>{t.common.admin}</span>
                    </NavLink>
                  )}
                  <button
                    className="w-full flex items-center gap-2 text-sm text-[var(--muted)] p-2"
                    onClick={() => {
                      logout();
                      setMobileMenu(false);
                    }}
                  >
                    <LogOut size={16} />
                    <span>{t.common.logout} ({profile?.name || user.email?.split('@')[0]})</span>
                  </button>
                </div>
              ) : (
                <button
                  className="w-full flex items-center gap-2 text-sm text-[var(--green)] p-2 font-medium"
                  onClick={() => {
                    navigate('/login');
                    setMobileMenu(false);
                  }}
                >
                  <CircleUserRound size={16} />
                  <span>{t.common.login}</span>
                </button>
              )}
            </div>

            <div className="drawer-note">
              {t.common.drawerNote}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
