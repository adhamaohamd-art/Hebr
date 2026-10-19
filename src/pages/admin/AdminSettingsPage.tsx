import React, { useState, useEffect } from 'react';
import { Check, Save } from 'lucide-react';
import { LoadingState } from '../../components/States';
import { settingsService, defaultSettings } from '../../services/settingsService';
import { useLanguage } from '../../context/LanguageContext';
import { SiteSettings } from '../../types';
import { AdminGenresCard } from './AdminGenresCard';

export const AdminSettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const s = await settingsService.getSettings();
        setSettings(s);
      } catch (e) {
        console.warn('Error loading settings:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      // customGenres is saved by the Genres card itself — don't overwrite it with a stale copy here
      const { customGenres: _customGenres, ...rest } = settings;
      await settingsService.updateSettings(rest);
      setNotice(t.adminSettings.successNotice);
      setTimeout(() => setNotice(''), 4000);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      setNotice(t.common.error);
      setTimeout(() => setNotice(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message={t.common.loading} />;
  }

  return (
    <div style={{ maxWidth: '780px' }}>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-medium">{t.adminSettings.pageTitle}</h2>
        <p className="text-xs text-[var(--muted)]">
          {t.adminSettings.pageSubtitle}
        </p>
      </div>

      {notice && (
        <div className="mb-6 p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs flex items-center gap-2">
          <Check size={16} /> {notice}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 border border-[var(--line)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">{t.adminSettings.siteName}</label>
            <input
              type="text"
              required
              value={settings.siteName}
              onChange={e => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full p-2 border border-[var(--line)] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">{t.adminSettings.tagline}</label>
            <input
              type="text"
              value={settings.logoText}
              onChange={e => setSettings({ ...settings, logoText: e.target.value })}
              className="w-full p-2 border border-[var(--line)] text-xs"
            />
          </div>
        </div>

        {/* Writers' revenue share */}
        <div className="p-4 bg-stone-50 border border-[var(--line)] space-y-2">
          <h4 className="font-serif text-base font-medium text-[var(--green)]">نسبة الكاتب من المبيعات</h4>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            نسبة الكاتب من كل عملية بيع لروايته أو كتابه الرقمي (بعد الخصم). الباقي للمنصة. تُسجَّل النسبة وقت الموافقة
            على الطلب، فتغييرها لا يغيّر المبيعات القديمة. الافتراضي 70%.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={settings.writerSharePercent ?? 70}
              onChange={e => setSettings({ ...settings, writerSharePercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
              className="w-24 p-2 border border-[var(--line)] text-xs font-mono"
            />
            <span className="text-xs">% للكاتب · {100 - (settings.writerSharePercent ?? 70)}% للمنصة</span>
          </div>
        </div>

        {/* Payment Configuration */}
        <div className="p-4 bg-stone-50 border border-[var(--line)] space-y-4">
          <h4 className="font-serif text-base font-medium text-[var(--green)]">
            {t.adminSettings.paymentConfigTitle}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                {t.adminSettings.vodafoneCash}
              </label>
              <input
                type="text"
                required
                value={settings.vodafoneCashNumber}
                onChange={e =>
                  setSettings({ ...settings, vodafoneCashNumber: e.target.value })
                }
                className="w-full p-2 border border-[var(--line)] text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                {t.adminSettings.instapayHandle}
              </label>
              <input
                type="text"
                required
                value={settings.instapayHandle}
                onChange={e =>
                  setSettings({ ...settings, instapayHandle: e.target.value })
                }
                className="w-full p-2 border border-[var(--line)] text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              {t.adminSettings.instructions}
            </label>
            <textarea
              rows={4}
              required
              value={settings.paymentInstructions}
              onChange={e =>
                setSettings({ ...settings, paymentInstructions: e.target.value })
              }
              className="w-full p-2.5 border border-[var(--line)] text-xs leading-relaxed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">{t.adminSettings.contactEmail}</label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
            className="w-full p-2 border border-[var(--line)] text-xs font-mono"
          />
        </div>

        <div className="pt-4 border-t border-[var(--line)] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="primary-button"
          >
            <Save size={16} /> {saving ? t.adminSettings.saving : t.adminSettings.saveBtn}
          </button>
        </div>
      </form>

      <AdminGenresCard />
    </div>
  );
};
