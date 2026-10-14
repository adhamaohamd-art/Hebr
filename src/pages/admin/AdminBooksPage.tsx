import React, { useState, useEffect } from 'react';
import { Edit2, Check, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { Cover } from '../../components/Cover';
import { LoadingState } from '../../components/States';
import { novelService } from '../../services/novelService';
import { bookFileService } from '../../services/bookFileService';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedNovelField } from '../../i18n/translations';
import { Novel, BookFile } from '../../types';
import { getAdminErrorMessage } from '../../lib/firebase';

export const AdminBooksPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [bookFiles, setBookFiles] = useState<Record<string, BookFile>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bookPriceInput, setBookPriceInput] = useState<number | ''>('');
  const [fileUrlInput, setFileUrlInput] = useState<string>('');
  const [fileNameInput, setFileNameInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchNovelsAndFiles = async () => {
    try {
      setLoading(true);
      const data = await novelService.getNovels();
      setNovels(data);

      // Fetch book files for all novels
      const filesMap: Record<string, BookFile> = {};
      await Promise.all(
        data.map(async n => {
          const bf = await bookFileService.getBookFile(n.id);
          if (bf) {
            filesMap[n.id] = bf;
          }
        })
      );
      setBookFiles(filesMap);
    } catch (e) {
      console.warn('Error fetching novels and book files:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovelsAndFiles();
  }, []);

  const handleStartEdit = (n: Novel) => {
    setEditingId(n.id);
    setBookPriceInput(n.bookPrice ?? '');
    const currentFile = bookFiles[n.id];
    setFileUrlInput(currentFile?.fileUrl || n.bookFileUrl || '');
    setFileNameInput(currentFile?.fileName || '');
    setValidationError('');
  };

  const handleSaveBook = async (novelId: string) => {
    const trimmedUrl = fileUrlInput.trim();
    if (trimmedUrl) {
      if (!trimmedUrl.startsWith('https://')) {
        setValidationError('رابط التحميل يجب أن يبدأ بـ https:// (HTTPS فقط)');
        return;
      }
      if (trimmedUrl.length > 500) {
        setValidationError('رابط التحميل يجب ألا يتجاوز 500 حرف');
        return;
      }
    }

    try {
      setSaving(true);
      setValidationError('');
      const priceVal = bookPriceInput === '' ? null : Number(bookPriceInput);

      // 1. Save novel book price
      await novelService.saveNovel(
        {
          bookPrice: priceVal,
        },
        novelId
      );

      // 2. Save book file link in protected collection bookFiles/{novelId}
      if (trimmedUrl) {
        await bookFileService.saveBookFile(novelId, trimmedUrl, fileNameInput.trim());
      } else {
        await bookFileService.deleteBookFile(novelId);
      }

      setEditingId(null);
      setNotice({ type: 'success', msg: t.adminBooks.successNotice });
      setTimeout(() => setNotice(null), 3500);
      await fetchNovelsAndFiles();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      setNotice({ type: 'error', msg: getAdminErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message={t.common.loading} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-medium">{t.adminBooks.pageTitle}</h2>
        <p className="text-xs text-[var(--muted)]">{t.adminBooks.pageSubtitle}</p>
      </div>

      {notice && (
        <div
          className={`mb-4 p-3 border text-xs flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check size={16} /> {notice.msg}
          </div>
          <button onClick={() => setNotice(null)} className="underline text-xs">
            {t.common.close}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
        {novels.map(novel => {
          const isEditing = editingId === novel.id;
          const hasBook = Boolean(novel.bookPrice);
          const novelTitle = getLocalizedNovelField(novel, 'title', language);
          const authorName = getLocalizedNovelField(novel, 'author', language);
          const currentFile = bookFiles[novel.id];

          return (
            <div
              key={novel.id}
              className="p-5 border border-[var(--line)] bg-white flex gap-5 items-start"
            >
              <div className="w-24 shrink-0">
                <Cover novel={novel} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-serif text-lg font-medium truncate">{novelTitle}</h3>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
                      hasBook ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {hasBook ? t.adminBooks.hasBookBadge : t.adminBooks.noBookBadge}
                  </span>
                </div>

                <p className="text-xs text-[var(--muted)] mb-3">{authorName}</p>

                {isEditing ? (
                  <div className="space-y-3 pt-2 border-t border-[var(--line)]">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {t.adminBooks.priceLabel}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bookPriceInput}
                        onChange={e =>
                          setBookPriceInput(e.target.value ? Number(e.target.value) : '')
                        }
                        placeholder={t.adminNovels.bookPricePlaceholder}
                        className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                        <LinkIcon size={12} /> {t.adminBooks.downloadUrlLabel}
                      </label>
                      <input
                        type="url"
                        maxLength={500}
                        value={fileUrlInput}
                        onChange={e => {
                          setFileUrlInput(e.target.value);
                          setValidationError('');
                        }}
                        placeholder={t.adminBooks.downloadUrlPlaceholder}
                        className="w-full p-2 border border-[var(--line)] text-xs font-mono bg-white"
                        dir="ltr"
                      />
                      <span className="text-[11px] text-[var(--muted)] block mt-0.5">
                        {t.adminBooks.downloadUrlHint}
                      </span>
                    </div>

                    {validationError && (
                      <p className="text-xs text-red-600">{validationError}</p>
                    )}

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        disabled={saving}
                        className="outline-button small"
                        onClick={() => setEditingId(null)}
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        className="primary-button small"
                        onClick={() => handleSaveBook(novel.id)}
                      >
                        {saving ? t.common.loading : t.adminBooks.saveBtn}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-[var(--muted)] space-y-1 my-3 bg-stone-50 p-2.5 border border-stone-200">
                      <div>
                        {t.adminNovels.colBookPrice}:{' '}
                        <b>
                          {novel.bookPrice ? `${novel.bookPrice} ${t.common.currency}` : '—'}
                        </b>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{t.adminBooks.fileUrlLabel}</span>{' '}
                        {currentFile?.fileUrl ? (
                          <span className="text-emerald-700 font-mono flex items-center gap-1">
                            {t.adminBooks.fileAvailable}
                            <a
                              href={currentFile.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-stone-400 hover:text-black ml-1"
                              title="فتح الرابط للمعاينة"
                            >
                              <ExternalLink size={11} />
                            </a>
                          </span>
                        ) : (
                          <span className="text-amber-700">{t.adminBooks.fileMissing}</span>
                        )}
                      </div>
                    </div>

                    <button
                      className="outline-button small"
                      onClick={() => handleStartEdit(novel)}
                    >
                      <Edit2 size={13} /> {t.adminBooks.editBtn}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
