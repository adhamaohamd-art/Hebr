import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Star, SlidersHorizontal as Sliders } from 'lucide-react';
import { Cover } from '../../components/Cover';
import { LoadingState } from '../../components/States';
import { novelService } from '../../services/novelService';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedNovelField } from '../../i18n/translations';
import { Novel } from '../../types';
import { getAdminErrorMessage } from '../../lib/firebase';
import { getNovelRatingSummary } from '../../lib/rating';
import { GENRE_KEYS, MAX_GENRES, getNovelGenres, genreFieldsForSave, getLocalizedGenres } from '../../lib/genres';

export const AdminNovelsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNovel, setEditingNovel] = useState<Partial<Novel> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchNovels = async () => {
    try {
      setLoading(true);
      const data = await novelService.getNovels();
      setNovels(data);
      setErrorMsg('');
    } catch (e) {
      setErrorMsg(getAdminErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovels();
  }, []);

  const handleOpenNew = () => {
    setEditingNovel({
      title: '',
      titleEn: '',
      author: '',
      authorEn: '',
      genre: 'رومانسية',
      genreEn: 'Romance',
      genres: ['رومانسية'],
      status: 'مستمرة',
      description: '',
      descriptionEn: '',
      color: '#314f49',
      accent: '#d9bb91',
      novelPrice: 40,
      bookPrice: 60,
      freeChapters: 2,
      chaptersCount: 0,
      published: true,
      coverUrl: '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNovel) return;
    try {
      setSaving(true);
      setErrorMsg('');
      await novelService.saveNovel(editingNovel, editingNovel.id);
      setEditingNovel(null);
      setToastMsg(t.common.success);
      setTimeout(() => setToastMsg(''), 3000);
      await fetchNovels();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      // Keep the modal open so nothing the admin typed is lost, and show the real reason.
      setErrorMsg(getAdminErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setErrorMsg('');
      await novelService.deleteNovel(deleteTarget.id);
      setToastMsg(t.common.success);
      setTimeout(() => setToastMsg(''), 3000);
      await fetchNovels();
    } catch (err: unknown) {
      setErrorMsg(getAdminErrorMessage(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleTogglePublish = async (novel: Novel) => {
    try {
      setErrorMsg('');
      await novelService.saveNovel({ published: !novel.published }, novel.id);
      await fetchNovels();
    } catch (err: unknown) {
      setErrorMsg(getAdminErrorMessage(err));
    }
  };

  if (loading) {
    return <LoadingState message={t.common.loading} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-serif text-2xl font-medium">{t.adminNovels.pageTitle}</h2>
          <p className="text-xs text-[var(--muted)]">{t.adminNovels.pageSubtitle}</p>
        </div>
        <button className="primary-button small" onClick={handleOpenNew}>
          <Plus size={15} /> {t.adminNovels.addNewBtn}
        </button>
      </div>

      {toastMsg && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs">
          {toastMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Novels Table */}
      <div className="admin-panel table-panel">
        <table>
          <thead>
            <tr>
              <th>{t.adminNovels.colCoverTitle}</th>
              <th>{t.adminNovels.colAuthor}</th>
              <th>{t.adminNovels.colGenre}</th>
              <th>{t.adminNovels.colNovelPrice}</th>
              <th>{t.adminNovels.colBookPrice}</th>
              <th>{t.adminNovels.colFreeChapters}</th>
              <th>{t.adminNovels.colStatus}</th>
              <th>{t.common.rating}</th>
              <th>{t.adminNovels.colPublishing}</th>
              <th>{t.adminNovels.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {novels.map(novel => {
              const displayTitle = getLocalizedNovelField(novel, 'title', language);
              const displayAuthor = getLocalizedNovelField(novel, 'author', language);
              const displayGenre = getLocalizedGenres(novel, language).join('، ');
              const displayStatus = t.statusLabels[novel.status] || novel.status;

              return (
                <tr key={novel.id}>
                  <td>
                    <div className="table-book">
                      <Cover novel={novel} />
                      <div>
                        <b>{displayTitle}</b>
                        <small className="block text-[var(--muted)]">
                          {novel.chaptersCount} {t.common.chaptersCount}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{displayAuthor}</td>
                  <td>{displayGenre}</td>
                  <td>
                    <b>{novel.novelPrice} {t.common.currency}</b>
                  </td>
                  <td>
                    {novel.bookPrice ? `${novel.bookPrice} ${t.common.currency}` : '—'}
                  </td>
                  <td>
                    {t.adminNovels.firstNChaptersFree.replace('{n}', String(novel.freeChapters || 1))}
                  </td>
                  <td>
                    <span className={`status-pill ${novel.status === 'مكتملة' ? 'done' : ''}`}>
                      {displayStatus}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const summary = getNovelRatingSummary(novel);
                      return (
                        <div className="text-xs">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/ratings?novelId=${novel.id}`)}
                            className={`flex items-center gap-1 hover:underline text-start ${
                              summary.isEditorial ? 'font-semibold text-amber-800' : 'text-amber-700'
                            }`}
                            title="انقر لإدارة إحصاءات تقييم هذه الرواية"
                          >
                            <span>★ {summary.displayAverage}</span>
                            {summary.isCombined && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1 rounded">
                                مدمج ({summary.totalCount})
                              </span>
                            )}
                            {summary.isEditorial && (
                              <span className="text-[9px] bg-amber-700 text-white px-1 rounded">
                                تحرير
                              </span>
                            )}
                            {summary.isCustom && (
                              <span className="text-[9px] bg-stone-200 px-1 rounded">
                                مخصص
                              </span>
                            )}
                            {summary.isVisitorOnly && summary.visitorCount > 0 && (
                              <small className="text-[10px] text-[var(--muted)]">
                                ({summary.visitorCount} زائر)
                              </small>
                            )}
                          </button>
                          {novel.ratingsEnabled === false && (
                            <span className="block text-[9px] text-red-600 font-medium">التقييمات مغلقة</span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleTogglePublish(novel)}
                      className={`px-2 py-1 text-xs flex items-center gap-1 ${
                        novel.published ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {novel.published ? <Eye size={12} /> : <EyeOff size={12} />}
                      {novel.published ? t.adminNovels.published : t.adminNovels.draft}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/ratings?novelId=${novel.id}`)}
                        className="p-1 hover:text-amber-700 text-stone-500"
                        title={t.adminRatingManagement.quickNovelRatingsBtn}
                        aria-label={t.adminRatingManagement.quickNovelRatingsBtn}
                      >
                        <Star size={15} />
                      </button>
                      <button
                        onClick={() => setEditingNovel(novel)}
                        className="p-1 hover:text-[var(--green)]"
                        title={t.common.edit}
                        aria-label={t.common.edit}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: novel.id, title: displayTitle })}
                        className="p-1 text-red-600 hover:text-red-800"
                        title={t.common.delete}
                        aria-label={t.common.delete}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--line)] max-w-md w-full p-6 text-start shadow-xl">
            <h3 className="font-serif text-lg font-medium mb-2">{t.adminNovels.deleteConfirm}</h3>
            <p className="text-xs text-[var(--muted)] mb-6">
              <strong>{deleteTarget.title}</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="outline-button small"
                onClick={() => setDeleteTarget(null)}
              >
                {t.adminNovels.cancel}
              </button>
              <button
                type="button"
                className="primary-button small bg-red-700 hover:bg-red-800 text-white"
                onClick={confirmDelete}
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Create/Edit Novel */}
      {editingNovel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--line)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-start shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--line)] mb-4">
              <h3 className="font-serif text-xl font-medium">
                {editingNovel.id ? t.adminNovels.editNovelTitle : t.adminNovels.newNovelTitle}
              </h3>
              <button onClick={() => setEditingNovel(null)} className="text-[var(--muted)] hover:text-black">
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Arabic & English Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.titleAr}</label>
                  <input
                    type="text"
                    required
                    value={editingNovel.title || ''}
                    onChange={e => setEditingNovel({ ...editingNovel, title: e.target.value })}
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.titleEn}</label>
                  <input
                    type="text"
                    value={editingNovel.titleEn || ''}
                    onChange={e => setEditingNovel({ ...editingNovel, titleEn: e.target.value })}
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
              </div>

              {/* Arabic & English Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.authorAr}</label>
                  <input
                    type="text"
                    required
                    value={editingNovel.author || ''}
                    onChange={e => setEditingNovel({ ...editingNovel, author: e.target.value })}
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.authorEn}</label>
                  <input
                    type="text"
                    value={editingNovel.authorEn || ''}
                    onChange={e => setEditingNovel({ ...editingNovel, authorEn: e.target.value })}
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
              </div>

              {/* Genre, Status, Free Chapters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium mb-1">
                    {t.adminNovels.genre}
                    <span className="text-[var(--muted)] font-normal">
                      {' '}
                      {language === 'ar'
                        ? `(اختر حتى ${MAX_GENRES} تصنيفات — الأول هو التصنيف الأساسي)`
                        : `(pick up to ${MAX_GENRES} — the first is the primary genre)`}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GENRE_KEYS.map(key => {
                      const selected = getNovelGenres(editingNovel);
                      const isOn = selected.includes(key);
                      const atLimit = !isOn && selected.length >= MAX_GENRES;
                      return (
                        <button
                          type="button"
                          key={key}
                          aria-pressed={isOn}
                          disabled={atLimit}
                          onClick={() => {
                            const next = isOn ? selected.filter(g => g !== key) : [...selected, key];
                            if (next.length === 0) return; // at least one genre is required
                            setEditingNovel({ ...editingNovel, ...genreFieldsForSave(next) });
                          }}
                          className={`px-3 py-1 text-xs border transition ${
                            isOn
                              ? 'bg-[var(--green)] text-white border-[var(--green)]'
                              : 'bg-white border-[var(--line)] disabled:opacity-40'
                          }`}
                        >
                          {t.genres[key] || key}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.status}</label>
                  <select
                    value={editingNovel.status || 'مستمرة'}
                    onChange={e =>
                      setEditingNovel({
                        ...editingNovel,
                        status: e.target.value as 'مستمرة' | 'مكتملة',
                      })
                    }
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  >
                    <option value="مستمرة">{t.statusLabels['مستمرة']}</option>
                    <option value="مكتملة">{t.statusLabels['مكتملة']}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.freeChapters}</label>
                  <input
                    type="number"
                    min="0"
                    value={editingNovel.freeChapters ?? 2}
                    onChange={e =>
                      setEditingNovel({ ...editingNovel, freeChapters: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-medium mb-1">{t.adminNovels.descAr}</label>
                <textarea
                  rows={2}
                  required
                  value={editingNovel.description || ''}
                  onChange={e => setEditingNovel({ ...editingNovel, description: e.target.value })}
                  className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t.adminNovels.descEn}</label>
                <textarea
                  rows={2}
                  value={editingNovel.descriptionEn || ''}
                  onChange={e => setEditingNovel({ ...editingNovel, descriptionEn: e.target.value })}
                  className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.novelPrice}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingNovel.novelPrice ?? 35}
                    onChange={e =>
                      setEditingNovel({ ...editingNovel, novelPrice: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.bookPrice}</label>
                  <input
                    type="number"
                    min="0"
                    value={editingNovel.bookPrice ?? ''}
                    onChange={e =>
                      setEditingNovel({
                        ...editingNovel,
                        bookPrice: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder={t.adminNovels.bookPricePlaceholder}
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
              </div>

              {/* Cover styling */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-stone-50 border border-[var(--line)]">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.colorPrimary}</label>
                  <input
                    type="color"
                    value={editingNovel.color || '#314f49'}
                    onChange={e => setEditingNovel({ ...editingNovel, color: e.target.value })}
                    className="w-full h-8 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.colorAccent}</label>
                  <input
                    type="color"
                    value={editingNovel.accent || '#d9bb91'}
                    onChange={e => setEditingNovel({ ...editingNovel, accent: e.target.value })}
                    className="w-full h-8 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.adminNovels.coverUrl}</label>
                  <input
                    type="url"
                    value={editingNovel.coverUrl || ''}
                    onChange={e => setEditingNovel({ ...editingNovel, coverUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-1.5 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
              </div>

              {/* Rating Management Link & Controls */}
              <div className="p-4 bg-amber-50/70 border border-amber-300 space-y-3 rounded-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-amber-950 flex items-center gap-1.5">
                      <Star size={15} className="text-amber-700" />
                      <span>{t.adminRatingManagement.pageTitle}</span>
                    </h4>
                    <p className="text-[11px] text-stone-600">
                      {t.adminRatingManagement.pageSubtitle}
                    </p>
                  </div>
                  {editingNovel.id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/ratings?novelId=${editingNovel.id}`)}
                      className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-medium rounded flex items-center gap-1.5 transition"
                    >
                      <Sliders size={13} />
                      <span>{language === 'ar' ? 'فتح في إدارة التقييمات' : 'Open in Rating Management'}</span>
                    </button>
                  )}
                </div>

                {/* Ratings Enabled Toggle */}
                <div className="flex items-start gap-2.5 pt-2 border-t border-amber-200">
                  <input
                    type="checkbox"
                    id="ratingsEnabledCheck"
                    checked={editingNovel.ratingsEnabled !== false}
                    onChange={e =>
                      setEditingNovel({ ...editingNovel, ratingsEnabled: e.target.checked })
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <label htmlFor="ratingsEnabledCheck" className="text-xs font-medium cursor-pointer block text-stone-900">
                      {t.ratingControls.ratingsEnabledCheckbox}
                    </label>
                    <small className="text-[10px] text-[var(--muted)] block">
                      {t.ratingControls.ratingsEnabledHelp}
                    </small>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pubCheck"
                  checked={editingNovel.published ?? true}
                  onChange={e => setEditingNovel({ ...editingNovel, published: e.target.checked })}
                />
                <label htmlFor="pubCheck" className="text-xs font-medium cursor-pointer">
                  {t.adminNovels.published}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
                <button
                  type="button"
                  className="outline-button small"
                  onClick={() => setEditingNovel(null)}
                >
                  {t.adminNovels.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="primary-button small"
                >
                  {saving ? t.adminNovels.saving : t.adminNovels.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
