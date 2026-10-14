import { novelService } from './novelService';
import { buildEpub, buildPrintHtml, safeFileName, BookChapter, BookMeta } from '../lib/ebook';

const CONCURRENCY = 4;

export interface LoadedBook {
  chapters: BookChapter[];
  /** Chapters whose text could not be loaded (permission or missing document). */
  missing: number;
}

/**
 * Loads every published chapter of a novel for an entitled reader.
 * Cost: one Firestore read per chapter (plus rule lookups), once per download.
 * Firestore rules still decide access: a reader without an entitlement gets nothing back.
 */
export async function loadBookChapters(
  novelId: string,
  onProgress?: (done: number, total: number) => void
): Promise<LoadedBook> {
  const metas = [...(await novelService.getChapters(novelId, true))].sort((a, b) => a.number - b.number);
  const total = metas.length;
  const results: (BookChapter | null)[] = new Array(total).fill(null);
  let next = 0;
  let done = 0;

  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= total) return;
      const meta = metas[i];
      const content = await novelService.getChapterContent(meta.id);
      if (content && content.body && content.body.trim()) {
        results[i] = { title: meta.title, body: content.body };
      }
      done++;
      onProgress?.(done, total);
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));

  const chapters = results.filter((r): r is BookChapter => r !== null);
  return { chapters, missing: total - chapters.length };
}

export function downloadEpub(meta: BookMeta, chapters: BookChapter[]): void {
  const bytes = buildEpub(meta, chapters);
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/epub+zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFileName(meta.title)}.epub`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/**
 * Opens an empty window synchronously (must be called straight from the click handler,
 * otherwise browsers block the popup). Fill it later with writePrintWindow().
 */
export function openPrintWindow(loadingText: string): Window | null {
  const win = window.open('', '_blank');
  if (!win) return null;
  try {
    win.document.write(
      `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>...</title></head>` +
        `<body style="font-family:Tahoma,sans-serif;padding:32px;text-align:center">${loadingText}</body></html>`
    );
  } catch {
    // ignore: the window will simply be replaced when the book is ready
  }
  return win;
}

export function writePrintWindow(win: Window, meta: BookMeta, chapters: BookChapter[]): void {
  win.document.open();
  win.document.write(buildPrintHtml(meta, chapters));
  win.document.close();
  win.focus();
  // Give the browser a moment to lay out the Arabic text before opening the print dialog.
  setTimeout(() => {
    try {
      win.print();
    } catch {
      // the page also has a visible "print / save as PDF" button
    }
  }, 700);
}
