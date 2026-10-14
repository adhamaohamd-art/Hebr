import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  loadBookChapters,
  downloadEpub,
  openPrintWindow,
  writePrintWindow,
} from '../services/bookExportService';
import { BookMeta } from '../lib/ebook';

interface Props {
  novel: { id: string; title: string; author: string };
  /** Shown on the title page of the file ("licensed to ..."). */
  licensedTo?: string;
  small?: boolean;
}

/**
 * EPUB / PDF download for readers who bought the digital edition.
 * The file is generated in the browser from the chapters; nothing is stored on a server.
 */
export const BookDownloadButtons: React.FC<Props> = ({ novel, licensedTo, small }) => {
  const { t } = useLanguage();
  const [busy, setBusy] = useState<'epub' | 'pdf' | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [notice, setNotice] = useState('');

  const run = async (format: 'epub' | 'pdf') => {
    if (busy) return;
    setNotice('');

    // The print window must be opened inside the click, before any await.
    let win: Window | null = null;
    if (format === 'pdf') {
      win = openPrintWindow(t.novelDetail.bookPreparingShort);
      if (!win) {
        setNotice(t.novelDetail.bookPopupBlocked);
        return;
      }
    }

    try {
      setBusy(format);
      setProgress(null);
      const { chapters, missing } = await loadBookChapters(novel.id, (done, total) =>
        setProgress({ done, total })
      );

      if (chapters.length === 0) {
        win?.close();
        setNotice(t.novelDetail.bookNoChapters);
        return;
      }

      const meta: BookMeta = {
        id: novel.id,
        title: novel.title,
        author: novel.author,
        language: 'ar',
        licensedTo,
      };

      if (format === 'epub') {
        downloadEpub(meta, chapters);
      } else if (win) {
        writePrintWindow(win, meta, chapters);
      }

      if (missing > 0) {
        setNotice(t.novelDetail.bookPartial.replace('{n}', String(missing)));
      }
    } catch (err) {
      win?.close();
      if (import.meta.env.DEV) console.warn('Book export error:', err);
      setNotice(t.novelDetail.bookPrepareFailed);
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const btnClass = small ? 'outline-button small' : 'outline-button';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <button type="button" disabled={busy !== null} onClick={() => run('epub')} className={btnClass}>
          <Download size={small ? 14 : 16} /> {busy === 'epub' ? t.common.loading : t.novelDetail.bookEpubBtn}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => run('pdf')} className={btnClass}>
          <FileText size={small ? 14 : 16} /> {busy === 'pdf' ? t.common.loading : t.novelDetail.bookPdfBtn}
        </button>
      </div>
      {busy && progress && (
        <p className="text-xs text-[var(--muted)]">
          {t.novelDetail.bookPreparing
            .replace('{done}', String(progress.done))
            .replace('{total}', String(progress.total))}
        </p>
      )}
      {notice && (
        <p className="text-xs text-amber-800" role="status">
          {notice}
        </p>
      )}
    </div>
  );
};
