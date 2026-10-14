/**
 * Builds a digital book from a novel's chapters, entirely in the browser (no server, no Storage):
 *  - buildEpub()      -> a valid EPUB 3 file (with an EPUB 2 NCX for older readers), right-to-left Arabic.
 *  - buildPrintHtml() -> a print-styled HTML page; the browser's "Save as PDF" turns it into a PDF
 *                        with perfect Arabic shaping (PDF libraries in the browser handle Arabic badly).
 */
import { createZip, ZipEntry } from './zip';

export interface BookMeta {
  /** Stable id, used for the EPUB identifier. */
  id: string;
  title: string;
  author: string;
  language?: 'ar' | 'en';
  /** Printed on the title page as a light deterrent against sharing ("licensed to ..."). */
  licensedTo?: string;
  publisher?: string;
}

export interface BookChapter {
  title: string;
  body: string;
}

const encoder = new TextEncoder();

// Characters that are illegal in XML 1.0
// eslint-disable-next-line no-control-regex
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

export function escapeXml(input: string): string {
  return (input || '')
    .replace(INVALID_XML_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Splits a chapter body into paragraphs (blank line = new paragraph, like the reader page). */
export function splitParagraphs(body: string): string[] {
  return (body || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
}

function paragraphsHtml(body: string): string {
  return splitParagraphs(body)
    .map(p => `<p>${escapeXml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

export function safeFileName(title: string): string {
  const cleaned = (title || '')
    // eslint-disable-next-line no-control-regex -- control characters are intentionally stripped from file names
    .replace(/[\\/:*?"<>|\u0000-\u001F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return cleaned || 'book';
}

const LABELS = {
  ar: { by: 'تأليف', licensed: 'نسخة رقمية خاصة بالقارئ', contents: 'الفهرس', publisher: 'حَبْر' },
  en: { by: 'By', licensed: 'Digital copy licensed to', contents: 'Contents', publisher: 'Hebr' },
};

function chapterFileName(index: number): string {
  return `ch${String(index + 1).padStart(3, '0')}.xhtml`;
}

const XML_HEAD = '<?xml version="1.0" encoding="utf-8"?>';

function xhtmlPage(lang: string, dir: string, title: string, bodyInner: string): string {
  return `${XML_HEAD}
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8"/>
<title>${escapeXml(title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
${bodyInner}
</body>
</html>
`;
}

export function buildEpub(meta: BookMeta, chapters: BookChapter[], now: Date = new Date()): Uint8Array {
  const lang = meta.language || 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const labels = LABELS[lang];
  const identifier = `urn:hebr:novel:${meta.id}`;
  const modified = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const publisher = meta.publisher || labels.publisher;

  const css = `html, body { direction: ${dir}; }
body { font-family: serif; line-height: 1.9; margin: 5%; text-align: ${lang === 'ar' ? 'right' : 'left'}; }
h1, h2 { text-align: center; line-height: 1.5; }
h2 { margin: 1.2em 0 1.2em; }
p { margin: 0 0 1em 0; }
.title-page { text-align: center; margin-top: 25%; }
.title-page h1 { font-size: 2em; margin-bottom: 0.6em; }
.title-page .author { font-size: 1.3em; margin: 0.4em 0; }
.title-page .meta { font-size: 0.9em; margin-top: 2.5em; opacity: 0.75; }
`;

  const titleInner = `<div class="title-page">
<h1>${escapeXml(meta.title)}</h1>
<p class="author">${labels.by}: ${escapeXml(meta.author)}</p>
<p class="meta">${escapeXml(publisher)}</p>${
    meta.licensedTo ? `\n<p class="meta">${labels.licensed}: ${escapeXml(meta.licensedTo)}</p>` : ''
  }
</div>`;

  const chapterFiles = chapters.map((c, i) => ({
    file: chapterFileName(i),
    id: `ch${i + 1}`,
    title: c.title || `${i + 1}`,
    xhtml: xhtmlPage(lang, dir, c.title, `<h2>${escapeXml(c.title)}</h2>\n${paragraphsHtml(c.body)}`),
  }));

  const manifestItems = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '<item id="css" href="style.css" media-type="text/css"/>',
    '<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>',
    ...chapterFiles.map(c => `<item id="${c.id}" href="${c.file}" media-type="application/xhtml+xml"/>`),
  ].join('\n    ');

  const spineItems = [
    '<itemref idref="title"/>',
    '<itemref idref="nav"/>',
    ...chapterFiles.map(c => `<itemref idref="${c.id}"/>`),
  ].join('\n    ');

  const opf = `${XML_HEAD}
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${lang}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(meta.title)}</dc:title>
    <dc:creator>${escapeXml(meta.author)}</dc:creator>
    <dc:language>${lang}</dc:language>
    <dc:publisher>${escapeXml(publisher)}</dc:publisher>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine toc="ncx" page-progression-direction="${dir}">
    ${spineItems}
  </spine>
</package>
`;

  const navList = chapterFiles
    .map(c => `      <li><a href="${c.file}">${escapeXml(c.title)}</a></li>`)
    .join('\n');
  const nav = `${XML_HEAD}
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8"/>
<title>${labels.contents}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h2>${labels.contents}</h2>
    <ol>
${navList}
    </ol>
  </nav>
</body>
</html>
`;

  const ncxPoints = chapterFiles
    .map(
      (c, i) => `    <navPoint id="np${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${escapeXml(c.title)}</text></navLabel>
      <content src="${c.file}"/>
    </navPoint>`
    )
    .join('\n');
  const ncx = `${XML_HEAD}
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${lang}">
  <head>
    <meta name="dtb:uid" content="${escapeXml(identifier)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(meta.title)}</text></docTitle>
  <navMap>
${ncxPoints}
  </navMap>
</ncx>
`;

  const container = `${XML_HEAD}
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`;

  const text = (name: string, content: string): ZipEntry => ({ name, data: encoder.encode(content) });

  const entries: ZipEntry[] = [
    // The mimetype entry MUST be first and stored without compression (createZip never compresses).
    text('mimetype', 'application/epub+zip'),
    text('META-INF/container.xml', container),
    text('OEBPS/content.opf', opf),
    text('OEBPS/nav.xhtml', nav),
    text('OEBPS/toc.ncx', ncx),
    text('OEBPS/style.css', css),
    text('OEBPS/title.xhtml', xhtmlPage(lang, dir, meta.title, titleInner)),
    ...chapterFiles.map(c => text(`OEBPS/${c.file}`, c.xhtml)),
  ];

  return createZip(entries, now);
}

/**
 * A complete, print-styled HTML document. Open it in a window and call print():
 * the reader chooses "Save as PDF". Chapters start on a new page.
 */
export function buildPrintHtml(meta: BookMeta, chapters: BookChapter[]): string {
  const lang = meta.language || 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const labels = LABELS[lang];
  const publisher = meta.publisher || labels.publisher;

  const toc = chapters.map(c => `<li>${escapeXml(c.title)}</li>`).join('\n');
  const body = chapters
    .map(c => `<section class="chapter">\n<h2>${escapeXml(c.title)}</h2>\n${paragraphsHtml(c.body)}\n</section>`)
    .join('\n');

  const hint =
    lang === 'ar'
      ? 'لحفظ الكتاب كملف PDF: من نافذة الطباعة اختر «حفظ بتنسيق PDF» (Save as PDF).'
      : 'To save as PDF, choose "Save as PDF" in the print dialog.';
  const printBtn = lang === 'ar' ? 'طباعة / حفظ PDF' : 'Print / Save as PDF';

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeXml(meta.title)}</title>
<style>
  @page { size: A5; margin: 18mm 15mm; }
  * { box-sizing: border-box; }
  html { direction: ${dir}; }
  body {
    margin: 0;
    font-family: 'IBM Plex Sans Arabic', 'Noto Naskh Arabic', 'Amiri', 'Segoe UI', Tahoma, serif;
    font-size: 13pt;
    line-height: 2;
    color: #111;
    background: #fff;
  }
  .no-print { padding: 12px 16px; background: #faf9f5; border-bottom: 1px solid #ddd; font-size: 14px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .no-print button { padding: 8px 14px; border: 1px solid #23483f; background: #23483f; color: #fff; cursor: pointer; font: inherit; }
  .cover-page { text-align: center; padding-top: 30vh; page-break-after: always; }
  .cover-page h1 { font-size: 30pt; line-height: 1.5; margin: 0 0 16pt; }
  .cover-page .author { font-size: 16pt; margin: 6pt 0; }
  .cover-page .meta { font-size: 10pt; color: #555; margin-top: 28pt; }
  .toc-page { page-break-after: always; }
  .toc-page h2 { text-align: center; }
  .toc-page ol { margin: 0; padding: 0 ${dir === 'rtl' ? '1.8em 0 0' : '0 0 1.8em'}; }
  .chapter { page-break-before: always; }
  .chapter h2 { text-align: center; font-size: 18pt; margin: 0 0 18pt; line-height: 1.6; }
  .chapter p { margin: 0 0 10pt; text-align: justify; orphans: 3; widows: 3; }
  @media print { .no-print { display: none; } }
  @media screen { body { max-width: 720px; margin: 0 auto; padding: 0 16px 48px; } .cover-page { padding-top: 12vh; } }
</style>
</head>
<body>
<div class="no-print"><span>${hint}</span><button onclick="window.print()">${printBtn}</button></div>
<section class="cover-page">
  <h1>${escapeXml(meta.title)}</h1>
  <p class="author">${labels.by}: ${escapeXml(meta.author)}</p>
  <p class="meta">${escapeXml(publisher)}</p>${
    meta.licensedTo ? `\n  <p class="meta">${labels.licensed}: ${escapeXml(meta.licensedTo)}</p>` : ''
  }
</section>
<section class="toc-page">
  <h2>${labels.contents}</h2>
  <ol>
${toc}
  </ol>
</section>
${body}
</body>
</html>
`;
}
