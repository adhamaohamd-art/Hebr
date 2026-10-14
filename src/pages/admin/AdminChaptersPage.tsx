import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Upload,
  X,
  FileText,
} from 'lucide-react';
import { LoadingState } from '../../components/States';
import { novelService } from '../../services/novelService';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedNovelField, getLocalizedChapterTitle } from '../../i18n/translations';
import { Novel, ChapterMeta } from '../../types';
import { getAdminErrorMessage } from '../../lib/firebase';

export const AdminChaptersPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovelId, setSelectedNovelId] = useState<string>('');
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Editor modal state
  const [editingChapter, setEditingChapter] = useState<{
    id?: string;
    number: number;
    title: string;
    titleEn?: string;
    isFree: boolean;
    published: boolean;
    body: string;
  } | null>(null);

  // Bulk import modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete target modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    async function loadNovels() {
      try {
        setLoading(true);
        const list = await novelService.getNovels();
        setNovels(list);
        if (list.length > 0) {
          setSelectedNovelId(list[0].id);
        }
      } catch (err) {
        console.warn('Error loading novels for chapters:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNovels();
  }, []);

  const fetchChapters = async (novelId: string) => {
    if (!novelId) return;
    try {
      const chs = await novelService.getChapters(novelId, false);
      setChapters(chs);
    } catch (err) {
      console.warn('Error fetching chapters:', err);
    }
  };

  useEffect(() => {
    if (selectedNovelId) {
      fetchChapters(selectedNovelId);
    }
  }, [selectedNovelId]);

  const handleOpenNewChapter = () => {
    const nextNumber = chapters.length > 0 ? Math.max(...chapters.map(c => c.number)) + 1 : 1;
    setEditingChapter({
      number: nextNumber,
      title: `${t.common.chapter} ${nextNumber}`,
      titleEn: `Chapter ${nextNumber}`,
      isFree: nextNumber <= (novels.find(n => n.id === selectedNovelId)?.freeChapters ?? 2),
      published: true,
      body: '',
    });
  };

  const handleEditChapter = async (ch: ChapterMeta) => {
    let content = null;
    try {
      content = await novelService.getChapterContent(ch.id);
    } catch (err: unknown) {
      setNotice({ type: 'error', msg: getAdminErrorMessage(err) });
      return;
    }
    setEditingChapter({
      id: ch.id,
      number: ch.number,
      title: ch.title,
      titleEn: ch.titleEn || '',
      isFree: ch.isFree,
      published: ch.published,
      body: content?.body || '',
    });
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter || !selectedNovelId) return;

    try {
      setSaving(true);
      setNotice(null);
      await novelService.saveChapter(
        selectedNovelId,
        {
          number: Number(editingChapter.number),
          title: editingChapter.title,
          titleEn: editingChapter.titleEn || '',
          isFree: editingChapter.isFree,
          published: editingChapter.published,
        },
        editingChapter.id,
        editingChapter.body
      );
      setEditingChapter(null);
      setNotice({ type: 'success', msg: t.common.success });
      setTimeout(() => setNotice(null), 3500);
      await fetchChapters(selectedNovelId);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      // Modal stays open so the chapter text is not lost; the real reason is shown.
      setNotice({ type: 'error', msg: getAdminErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteChapter = async () => {
    if (!deleteTarget) return;
    try {
      await novelService.deleteChapter(selectedNovelId, deleteTarget.id);
      setNotice({ type: 'success', msg: t.common.success });
      setTimeout(() => setNotice(null), 3500);
    } catch (err: unknown) {
      setNotice({ type: 'error', msg: getAdminErrorMessage(err) });
    } finally {
      setDeleteTarget(null);
    }
    await fetchChapters(selectedNovelId);
  };

  // Bulk import parser: splits by "الفصل" or double line breaks
  const handleBulkImport = async () => {
    if (!bulkText.trim() || !selectedNovelId) return;

    try {
      setSaving(true);
      setNotice(null);
      // Split only where a LINE starts with "الفصل"/"Chapter" (never in the middle of a sentence).
      const rawChapters = bulkText.split(/^(?=(?:الفصل|Chapter)\s+\S)/im);
      let currentNumber = chapters.length > 0 ? Math.max(...chapters.map(c => c.number)) + 1 : 1;
      const freeCount = novels.find(n => n.id === selectedNovelId)?.freeChapters ?? 2;

      for (const raw of rawChapters) {
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const lines = trimmed.split('\n');
        const titleLine = lines[0].trim();
        const body = lines.slice(1).join('\n').trim();

        await novelService.saveChapter(
          selectedNovelId,
          {
            number: currentNumber,
            title: titleLine || `${t.common.chapter} ${currentNumber}`,
            isFree: currentNumber <= freeCount,
            published: true,
          },
          undefined,
          body || trimmed,
          { skipSync: true }
        );
        currentNumber++;
      }

      // One summary/catalog sync for the whole import instead of one per chapter
      await novelService.syncNovelChaptersSummary(selectedNovelId);

      setBulkModalOpen(false);
      setBulkText('');
      await fetchChapters(selectedNovelId);
      setNotice({ type: 'success', msg: t.common.success });
      setTimeout(() => setNotice(null), 3500);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error(err);
      // Some chapters may already be saved: refresh the list and try a sync so the state is consistent.
      setNotice({ type: 'error', msg: getAdminErrorMessage(err) });
      try {
        await novelService.syncNovelChaptersSummary(selectedNovelId);
      } catch {
        // reported above
      }
      await fetchChapters(selectedNovelId);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setBulkText((ev.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  if (loading) {
    return <LoadingState message={t.common.loading} />;
  }

  const selectedNovel = novels.find(n => n.id === selectedNovelId);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-medium">{t.adminChapters.pageTitle}</h2>
          <p className="text-xs text-[var(--muted)]">{t.adminChapters.pageSubtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="outline-button small"
            onClick={() => setBulkModalOpen(true)}
            disabled={!selectedNovelId}
          >
            <Upload size={14} /> {t.adminChapters.bulkImportBtn}
          </button>
          <button
            className="primary-button small"
            onClick={handleOpenNewChapter}
            disabled={!selectedNovelId}
          >
            <Plus size={15} /> {t.adminChapters.addNewBtn}
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`mb-4 p-3 border text-xs flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          <span>{notice.msg}</span>
          <button onClick={() => setNotice(null)} className="underline text-xs">
            {t.common.close}
          </button>
        </div>
      )}

      {/* Novel Selector */}
      <div className="p-4 bg-white border border-[var(--line)] mb-6 flex flex-wrap items-center gap-4 text-start">
        <label className="text-xs font-semibold text-[var(--ink)]">
          {t.adminChapters.selectNovel}
        </label>
        <select
          value={selectedNovelId}
          onChange={e => setSelectedNovelId(e.target.value)}
          className="p-2 border border-[var(--line)] bg-white text-xs outline-none min-w-[240px]"
        >
          {novels.map(n => {
            const novelTitle = getLocalizedNovelField(n, 'title', language);
            const authorName = getLocalizedNovelField(n, 'author', language);
            return (
              <option key={n.id} value={n.id}>
                {novelTitle} ({authorName})
              </option>
            );
          })}
        </select>

        {selectedNovel && (
          <span className="text-xs text-[var(--muted)]">
            {t.adminNovels.freeChapters}:{' '}
            <b>{t.adminNovels.firstNChaptersFree.replace('{n}', String(selectedNovel.freeChapters || 1))}</b>
          </span>
        )}
      </div>

      {/* Chapters Table */}
      <div className="admin-panel table-panel">
        {chapters.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--muted)]">
            {t.adminChapters.noChapters}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t.adminChapters.colNumber}</th>
                <th>{t.adminChapters.colTitle}</th>
                <th>{t.adminChapters.colAccess}</th>
                <th>{t.adminChapters.colPublished}</th>
                <th>{t.adminChapters.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map(ch => {
                const chapterTitle = getLocalizedChapterTitle(ch, language);
                return (
                  <tr key={ch.id}>
                    <td>
                      <b>{t.novelDetail.chapterNumberPrefix} {ch.number}</b>
                    </td>
                    <td>{chapterTitle}</td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold ${
                          ch.isFree
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ch.isFree ? <Unlock size={12} /> : <Lock size={12} />}
                        {ch.isFree ? t.adminChapters.freeBadge : t.adminChapters.lockedBadge}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold ${
                          ch.published
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {ch.published ? t.common.published : t.common.draft}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditChapter(ch)}
                          className="p-1 hover:text-[var(--green)]"
                          title={t.common.edit}
                          aria-label={t.common.edit}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: ch.id, title: chapterTitle })}
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
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--line)] max-w-md w-full p-6 text-start shadow-xl">
            <h3 className="font-serif text-lg font-medium mb-2">{t.adminChapters.deleteConfirm}</h3>
            <p className="text-xs text-[var(--muted)] mb-6">
              <strong>{deleteTarget.title}</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="outline-button small"
                onClick={() => setDeleteTarget(null)}
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                className="primary-button small bg-red-700 hover:bg-red-800 text-white"
                onClick={confirmDeleteChapter}
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal for Chapter */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--line)] w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 text-start shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--line)] mb-4">
              <h3 className="font-serif text-xl font-medium">
                {editingChapter.id ? t.adminChapters.editModalTitle : t.adminChapters.newModalTitle}
              </h3>
              <button
                onClick={() => setEditingChapter(null)}
                className="text-[var(--muted)] hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            {notice?.type === 'error' && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">
                {notice.msg}
              </div>
            )}

            <form onSubmit={handleSaveChapter} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {t.adminChapters.chapterNumber}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingChapter.number}
                    onChange={e =>
                      setEditingChapter({ ...editingChapter, number: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {t.adminChapters.chapterTitleAr}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingChapter.title}
                    onChange={e =>
                      setEditingChapter({ ...editingChapter, title: e.target.value })
                    }
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {t.adminChapters.chapterTitleEn}
                  </label>
                  <input
                    type="text"
                    value={editingChapter.titleEn || ''}
                    onChange={e =>
                      setEditingChapter({ ...editingChapter, titleEn: e.target.value })
                    }
                    className="w-full p-2 border border-[var(--line)] text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 py-2 border-y border-[var(--line)]">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingChapter.isFree}
                    onChange={e =>
                      setEditingChapter({ ...editingChapter, isFree: e.target.checked })
                    }
                  />
                  <span>{t.adminChapters.isFreeLabel}</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingChapter.published}
                    onChange={e =>
                      setEditingChapter({ ...editingChapter, published: e.target.checked })
                    }
                  />
                  <span>{t.adminChapters.publishLabel}</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  {t.adminChapters.bodyLabel}
                </label>
                <textarea
                  rows={14}
                  required
                  value={editingChapter.body}
                  onChange={e =>
                    setEditingChapter({ ...editingChapter, body: e.target.value })
                  }
                  className="w-full p-3 border border-[var(--line)] text-sm font-sans outline-none focus:border-[var(--green)] leading-relaxed bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
                <button
                  type="button"
                  className="outline-button small"
                  onClick={() => setEditingChapter(null)}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="primary-button small"
                >
                  {saving ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[var(--line)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-start shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--line)] mb-4">
              <h3 className="font-serif text-xl font-medium">{t.adminChapters.bulkModalTitle}</h3>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="text-[var(--muted)] hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            {notice?.type === 'error' && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-300 text-xs" role="alert">
                {notice.msg}
              </div>
            )}

            <p className="text-xs text-[var(--muted)] mb-4 leading-relaxed">
              {t.adminChapters.bulkModalHelp}
            </p>

            <div className="mb-4">
              <label className="border border-dashed border-[var(--line)] p-3 block text-center cursor-pointer text-xs text-[var(--bronze)] hover:border-[var(--green)]">
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileText size={18} className="mx-auto mb-1" />
                {t.adminChapters.bulkImportBtn} (.txt / .md)
              </label>
            </div>

            <textarea
              rows={12}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              className="w-full p-3 border border-[var(--line)] text-xs font-mono outline-none focus:border-[var(--green)] leading-relaxed bg-white"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)] mt-4">
              <button
                type="button"
                className="outline-button small"
                onClick={() => setBulkModalOpen(false)}
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={saving || !bulkText.trim()}
                onClick={handleBulkImport}
                className="primary-button small"
              >
                {saving ? t.common.loading : t.adminChapters.bulkStartBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
