/**
 * lib/pdf.ts — Professional letterhead PDF engine for SENDA.
 *
 * Font strategy:
 *   Loads NotoSans-Regular.ttf + NotoSans-Bold.ttf from /public/fonts/ at
 *   module init. Noto Sans covers all Spanish accented characters AND the
 *   ₡ colón symbol (U+20A1). Falls back to Helvetica if the font files are
 *   absent (accented chars still work via WinAnsiEncoding; ₡ renders blank).
 *
 * Layout (A4 portrait, units: mm):
 *   [0–40]   Black header bar  — institution identity (UNADECA / SENDA)
 *   [40–42]  Indigo accent stripe
 *   [42–…]   Report title + optional subtitle
 *   […]      Metadata block (gray rounded rect, 2-column key-value pairs)
 *   […]      Data table (autoTable, grid theme)
 *   [H-12–H] Black footer bar — institution name + date + page number
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCostaRicaLongDate } from './utils';

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  black:     [29,  50,  97 ] as [number, number, number],
  accent:    [99,  102, 241] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  ghostWhite:[200, 200, 212] as [number, number, number],
  lightGray: [245, 245, 247] as [number, number, number],
  midGray:   [156, 163, 175] as [number, number, number],
  darkGray:  [55,  65,  81 ] as [number, number, number],
  rowAlt:    [249, 250, 251] as [number, number, number],
};

// ─── Font loading ─────────────────────────────────────────────────────────────
// Noto Sans covers U+20A1 (₡) and the full Latin Extended block (á é ó ú ñ…).
// Place NotoSans-Regular.ttf and NotoSans-Bold.ttf in frontend/public/fonts/.
// Download from: https://fonts.google.com/noto/specimen/Noto+Sans
//   → Download family → unzip → static/TTF → copy the two Regular/Bold files.

interface FontCache { regular: string; bold: string }
let _fonts: FontCache | null = null;

async function _buf2b64(buf: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buf);
  const chunks: string[] = [];
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    chunks.push(String.fromCharCode(...(bytes.subarray(i, i + CHUNK) as unknown as number[])));
  }
  return btoa(chunks.join(''));
}

(async () => {
  try {
    const base = (import.meta.env.BASE_URL as string) ?? '/';
    const get = (name: string) =>
      fetch(`${base}fonts/${name}`).then(r => {
        if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
        // Reject HTML fallback pages served by SPA catch-all nginx rules
        const ct = r.headers.get('content-type') ?? '';
        if (ct.startsWith('text/') || ct.includes('html')) {
          throw new Error(`${name}: unexpected content-type ${ct}`);
        }
        return r.arrayBuffer();
      });
    const [regBuf, boldBuf] = await Promise.all([get('NotoSans-Regular.ttf'), get('NotoSans-Bold.ttf')]);
    _fonts = { regular: await _buf2b64(regBuf), bold: await _buf2b64(boldBuf) };
  } catch {
    // Font files absent or blocked — falls back to Helvetica silently
  }
})();

type FontFamily = 'NotoSans' | 'helvetica';

/** Register Noto Sans with this doc instance and return the family name to use. */
function setupFont(doc: jsPDF): FontFamily {
  if (!_fonts) return 'helvetica';
  try {
    doc.addFileToVFS('NotoSans-Regular.ttf', _fonts.regular);
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    doc.addFileToVFS('NotoSans-Bold.ttf', _fonts.bold);
    doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
    return 'NotoSans';
  } catch {
    _fonts = null; // bad data — clear so future calls skip straight to helvetica
    return 'helvetica';
  }
}

// ─── Sanitize ────────────────────────────────────────────────────────────────
// Only strips control characters that would corrupt the PDF stream.
// All printable characters — including ₡, á, é, ó, ú, ñ, ü — are left intact
// so the unicode font can render them correctly.
function sanitize(value: string | number): string {
  return String(value)
    .replace(/ /g, ' ')                 // non-breaking space → regular space
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // control chars (keep \t \n \r)
    .trim();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setFill(doc: jsPDF, [r, g, b]: [number, number, number]) { doc.setFillColor(r, g, b); }
function setTextColor(doc: jsPDF, [r, g, b]: [number, number, number]) { doc.setTextColor(r, g, b); }
function setDrawColor(doc: jsPDF, [r, g, b]: [number, number, number]) { doc.setDrawColor(r, g, b); }

function drawLetterhead(doc: jsPDF, W: number, F: FontFamily) {
  setFill(doc, C.black);
  doc.rect(0, 0, W, 40, 'F');

  setTextColor(doc, C.white);
  doc.setFont(F, 'bold');
  doc.setFontSize(22);
  doc.text('UNADECA', 14, 17);

  doc.setFont(F, 'normal');
  doc.setFontSize(8.5);
  setTextColor(doc, C.ghostWhite);
  doc.text('Universidad Adventista de Centroamérica', 14, 24.5);
  doc.setFontSize(7.5);
  doc.text('Alajuela, Costa Rica', 14, 30);

  setDrawColor(doc, [70, 70, 80]);
  doc.setLineWidth(0.3);
  doc.line(W - 78, 8, W - 78, 34);

  setTextColor(doc, C.white);
  doc.setFont(F, 'bold');
  doc.setFontSize(16);
  doc.text('SENDA', W - 14, 17, { align: 'right' });

  doc.setFont(F, 'normal');
  doc.setFontSize(7.5);
  setTextColor(doc, C.ghostWhite);
  doc.text('Sis. Estratégico de Normalización', W - 14, 24.5, { align: 'right' });
  doc.text('y Desarrollo Académico', W - 14, 30, { align: 'right' });

  setFill(doc, C.accent);
  doc.rect(0, 40, W, 2.5, 'F');
}

function drawFooter(doc: jsPDF, W: number, H: number, pageNum: number, totalPages: number, F: FontFamily) {
  setFill(doc, C.black);
  doc.rect(0, H - 12, W, 12, 'F');
  setTextColor(doc, C.ghostWhite);
  doc.setFont(F, 'normal');
  doc.setFontSize(6.5);
  doc.text('UNADECA | SENDA — Documento Oficial', 14, H - 4.5);
  doc.text(
    `Generado el ${formatCostaRicaLongDate()} — Página ${pageNum} de ${totalPages}`,
    W - 14, H - 4.5, { align: 'right' },
  );
}

function drawMeta(doc: jsPDF, W: number, startY: number, meta: PDFMetaItem[], F: FontFamily): number {
  const colL = 18;
  const colR = W / 2 + 8;
  const pairH = 10;
  const padV = 5;
  const rows = Math.ceil(meta.length / 2);
  const blockH = rows * pairH + padV * 2;

  setFill(doc, C.lightGray);
  setDrawColor(doc, [229, 231, 235]);
  doc.setLineWidth(0.2);
  doc.roundedRect(10, startY, W - 20, blockH, 2, 2, 'FD');

  meta.forEach((item, idx) => {
    const col = idx % 2 === 0 ? colL : colR;
    const row = Math.floor(idx / 2);
    const y = startY + padV + row * pairH;

    doc.setFont(F, 'bold');
    doc.setFontSize(6.5);
    setTextColor(doc, C.midGray);
    doc.text(sanitize(item.label).toUpperCase(), col, y + 1.5);

    doc.setFont(F, 'normal');
    doc.setFontSize(9);
    setTextColor(doc, C.darkGray);
    doc.text(sanitize(item.value), col, y + 6.5);
  });

  return startY + blockH;
}

// ─── Public types ─────────────────────────────────────────────────────────────
export interface PDFMetaItem { label: string; value: string }

export interface PDFReportConfig {
  filename: string;
  reportTitle: string;
  subtitle?: string;
  meta: PDFMetaItem[];
  headers: string[];
  rows: (string | number)[][];
  landscape?: boolean;
}

// ─── renderPDF ────────────────────────────────────────────────────────────────
export function renderPDF(config: PDFReportConfig): void {
  const useLandscape = config.landscape ?? config.headers.length > 8;
  const doc = new jsPDF({ orientation: useLandscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const F = setupFont(doc);

  drawLetterhead(doc, W, F);

  let curY = 50;
  doc.setFont(F, 'bold');
  doc.setFontSize(13);
  setTextColor(doc, C.black);
  doc.text(sanitize(config.reportTitle), 14, curY);
  curY += 7;

  if (config.subtitle) {
    doc.setFont(F, 'normal');
    doc.setFontSize(9);
    setTextColor(doc, C.darkGray);
    doc.text(sanitize(config.subtitle), 14, curY);
    curY += 6;
  }
  curY += 3;

  const metaBottom = drawMeta(doc, W, curY, config.meta, F);
  const tableStartY = metaBottom + 6;

  const isWide = config.headers.length > 8;
  const headFontSize = isWide ? 6.5 : 8.5;
  const bodyFontSize = isWide ? 6 : 8;
  const cellPad = isWide ? 2 : 3;

  const columnStyles: Record<number, { cellWidth?: number; minCellWidth?: number }> = {};
  config.headers.forEach((h, i) => {
    if (h.toLowerCase().includes('descripcion') || h.toLowerCase().includes('motivo')) {
      columnStyles[i] = { minCellWidth: isWide ? 35 : 30 };
    }
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [config.headers.map(h => sanitize(h))],
    body: config.rows.map(row => row.map(cell => sanitize(cell))),
    theme: 'grid',
    styles: { font: F, overflow: 'linebreak' },
    headStyles: { fillColor: C.black, textColor: C.white, fontStyle: 'bold', fontSize: headFontSize, cellPadding: cellPad + 0.5 },
    bodyStyles: { fontSize: bodyFontSize, textColor: C.darkGray, cellPadding: cellPad },
    columnStyles,
    alternateRowStyles: { fillColor: C.rowAlt },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.15,
    margin: { left: 10, right: 10, bottom: 20 },
  });

  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, W, H, i, totalPages, F);
  }

  doc.save(config.filename);
}

// ─── Dept-grouped payroll PDF ─────────────────────────────────────────────────
export interface DeptGroupRow {
  deptName:   string;
  students: { name: string; carnet: string; hours: string; bruto: string; tithe: string; neto: string }[];
  totalHours: string;
  totalBruto: string;
  totalTithe: string;
  totalNeto:  string;
}

export function renderDeptGroupedPDF(config: {
  filename:    string;
  reportTitle: string;
  subtitle?:   string;
  meta:        PDFMetaItem[];
  deptGroups:  DeptGroupRow[];
  grandTotals: { hours: string; bruto: string; tithe: string; neto: string };
}): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const F = setupFont(doc);

  drawLetterhead(doc, W, F);

  let curY = 50;
  doc.setFont(F, 'bold');
  doc.setFontSize(13);
  setTextColor(doc, C.black);
  doc.text(sanitize(config.reportTitle), 14, curY);
  curY += 7;

  if (config.subtitle) {
    doc.setFont(F, 'normal');
    doc.setFontSize(9);
    setTextColor(doc, C.darkGray);
    doc.text(sanitize(config.subtitle), 14, curY);
    curY += 6;
  }
  curY += 3;

  curY = drawMeta(doc, W, curY, config.meta, F) + 6;

  const headers = ['Estudiante', 'Carnet', 'Horas', 'Bruto', 'Diezmo', 'Neto'];
  const colWidths = [55, 25, 16, 28, 28, 28];

  for (const dept of config.deptGroups) {
    setFill(doc, [40, 40, 45]);
    doc.rect(10, curY, W - 20, 8, 'F');
    setTextColor(doc, C.white);
    doc.setFont(F, 'bold');
    doc.setFontSize(8);
    doc.text(sanitize(dept.deptName).toUpperCase(), 14, curY + 5.5);
    curY += 8;

    const rows: string[][] = dept.students.map(s => [
      sanitize(s.name), s.carnet, s.hours,
      sanitize(s.bruto), sanitize(s.tithe), sanitize(s.neto),
    ]);
    rows.push(['TOTAL', '', dept.totalHours,
      sanitize(dept.totalBruto), sanitize(dept.totalTithe), sanitize(dept.totalNeto)]);

    autoTable(doc, {
      startY: curY,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: { font: F },
      headStyles: { fillColor: C.black, textColor: C.white, fontStyle: 'bold', fontSize: 7.5, cellPadding: 2.5 },
      bodyStyles: { fontSize: 7.5, textColor: C.darkGray, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: C.rowAlt },
      didParseCell: data => {
        if (data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [230, 230, 232];
        }
      },
      tableLineColor: [229, 231, 235],
      tableLineWidth: 0.15,
      columnStyles: colWidths.reduce<Record<number, { cellWidth: number }>>(
        (acc, w, i) => { acc[i] = { cellWidth: w }; return acc; }, {},
      ),
      margin: { left: 10, right: 10, bottom: 20 },
    });

    curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    if (curY > H - 40 && dept !== config.deptGroups[config.deptGroups.length - 1]) {
      doc.addPage();
      curY = 20;
    }
  }

  if (config.deptGroups.length > 0) {
    curY += 2;
    autoTable(doc, {
      startY: curY,
      head: [['TOTALES GENERALES', '', 'Horas', 'Bruto', 'Diezmo', 'Neto']],
      body: [['', '', config.grandTotals.hours,
        sanitize(config.grandTotals.bruto),
        sanitize(config.grandTotals.tithe),
        sanitize(config.grandTotals.neto)]],
      theme: 'grid',
      styles: { font: F },
      headStyles: { fillColor: C.black, textColor: C.white, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
      bodyStyles: { fontStyle: 'bold', fontSize: 8, cellPadding: 3, textColor: C.darkGray },
      columnStyles: colWidths.reduce<Record<number, { cellWidth: number }>>(
        (acc, w, i) => { acc[i] = { cellWidth: w }; return acc; }, {},
      ),
      margin: { left: 10, right: 10, bottom: 20 },
    });
  }

  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, W, H, i, totalPages, F);
  }

  doc.save(config.filename);
}
