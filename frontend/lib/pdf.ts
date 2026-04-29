/**
 * lib/pdf.ts — Professional letterhead PDF engine for SENDA.
 *
 * Exports one public function: `renderPDF(config)`.
 * Each portal composes its own PDFReportConfig and calls renderPDF.
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
  black:     [29,  50,  97 ] as [number, number, number], // navy #1d3261
  accent:    [99,  102, 241] as [number, number, number], // indigo-500
  white:     [255, 255, 255] as [number, number, number],
  ghostWhite:[200, 200, 212] as [number, number, number], // muted text on dark bg
  lightGray: [245, 245, 247] as [number, number, number], // meta block bg
  midGray:   [156, 163, 175] as [number, number, number], // label color
  darkGray:  [55,  65,  81 ] as [number, number, number], // value color
  rowAlt:    [249, 250, 251] as [number, number, number], // alternate row
};

// ─── Public types ─────────────────────────────────────────────────────────────
export interface PDFMetaItem {
  label: string;
  value: string;
}

export interface PDFReportConfig {
  /** Output filename, e.g. "nomina_ciclo.pdf" */
  filename: string;
  /** Main heading: "REPORTE DE HORAS — JUAN PÉREZ" */
  reportTitle: string;
  /** Optional one-liner below the title */
  subtitle?: string;
  /**
   * Key-value metadata rendered in the gray block.
   * Items alternate left/right column (first=left, second=right, etc.).
   * Recommended: 4–6 items.
   */
  meta: PDFMetaItem[];
  /** Column headers for the data table */
  headers: string[];
  /** Data rows (strings or numbers, converted to string automatically) */
  rows: (string | number)[][];
  /** Force landscape orientation (auto-detected when > 8 columns) */
  landscape?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setFill(doc: jsPDF, [r, g, b]: [number, number, number]) {
  doc.setFillColor(r, g, b);
}

function setTextColor(doc: jsPDF, [r, g, b]: [number, number, number]) {
  doc.setTextColor(r, g, b);
}

function setDrawColor(doc: jsPDF, [r, g, b]: [number, number, number]) {
  doc.setDrawColor(r, g, b);
}

function sanitizeForPdf(value: string | number): string {
  let str = String(value);
  
  // Replace problematic Unicode characters
  str = str.replace(/\u00a0/g, ' ');      // non-breaking space → regular space
  str = str.replace(/\u20A1/g, 'C');      // ₡ colón (U+20A1)
  str = str.replace(/₡/g, 'C');           // literal fallback
  
  // Normalize currency format if 'C' appears with number
  // E.g., "C1,000" → "C1,000" (ensure no extra spaces inside number)
  str = str.replace(/C\s+([0-9,.])/g, 'C$1');  // Remove space after C if before digit
  
  // Safety: replace any remaining non-ASCII that jsPDF Helvetica can't handle
  // This is a fallback for any unexpected Unicode that slipped through
  str = str.replace(/[^\x00-\x7F]/g, '?');     // Replace non-ASCII with '?'
  
  return str.trim();
}

function drawLetterhead(doc: jsPDF, W: number) {
  // ── Black header bar ────────────────────────────────────────────────────────
  setFill(doc, C.black);
  doc.rect(0, 0, W, 40, 'F');

  // ── Left side: institution ──────────────────────────────────────────────────
  setTextColor(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('UNADECA', 14, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setTextColor(doc, C.ghostWhite);
  doc.text('Universidad Adventista de Centroamérica', 14, 24.5);
  doc.setFontSize(7.5);
  doc.text('Alajuela, Costa Rica', 14, 30);

  // ── Vertical separator ──────────────────────────────────────────────────────
  setDrawColor(doc, [70, 70, 80]);
  doc.setLineWidth(0.3);
  doc.line(W - 78, 8, W - 78, 34);

  // ── Right side: SENDA ───────────────────────────────────────────────────────
  setTextColor(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SENDA', W - 14, 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTextColor(doc, C.ghostWhite);
  doc.text('Sis. Estratégico de Normalización', W - 14, 24.5, { align: 'right' });
  doc.text('y Desarrollo Académico', W - 14, 30, { align: 'right' });

  // ── Indigo accent stripe ─────────────────────────────────────────────────────
  setFill(doc, C.accent);
  doc.rect(0, 40, W, 2.5, 'F');
}

function drawFooter(doc: jsPDF, W: number, H: number, pageNum: number, totalPages: number) {
  setFill(doc, C.black);
  doc.rect(0, H - 12, W, 12, 'F');

  setTextColor(doc, C.ghostWhite);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('UNADECA | SENDA — Documento Oficial', 14, H - 4.5);
  doc.text(
    `Generado el ${formatCostaRicaLongDate()} — Página ${pageNum} de ${totalPages}`,
    W - 14,
    H - 4.5,
    { align: 'right' },
  );
}

function drawMeta(doc: jsPDF, W: number, startY: number, meta: PDFMetaItem[]): number {
  const colL = 18;
  const colR = W / 2 + 8;
  const pairH = 10;   // mm per meta-item row
  const padV = 5;     // top/bottom padding inside block
  const rows = Math.ceil(meta.length / 2);
  const blockH = rows * pairH + padV * 2;

  // Background
  setFill(doc, C.lightGray);
  setDrawColor(doc, [229, 231, 235]);
  doc.setLineWidth(0.2);
  doc.roundedRect(10, startY, W - 20, blockH, 2, 2, 'FD');

  meta.forEach((item, idx) => {
    const col = idx % 2 === 0 ? colL : colR;
    const row = Math.floor(idx / 2);
    const y = startY + padV + row * pairH;

    // Label (tiny caps)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    setTextColor(doc, C.midGray);
    doc.text(sanitizeForPdf(item.label).toUpperCase(), col, y + 1.5);

    // Value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setTextColor(doc, C.darkGray);
    doc.text(sanitizeForPdf(item.value), col, y + 6.5);
  });

  return startY + blockH; // returns bottom Y of the block
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function renderPDF(config: PDFReportConfig): void {
  const useLandscape = config.landscape ?? config.headers.length > 8;
  const orientation = useLandscape ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();   // 297 (landscape) or 210 (portrait)
  const H = doc.internal.pageSize.getHeight();  // 210 (landscape) or 297 (portrait)

  // ── Letterhead (page 1 only) ───────────────────────────────────────────────
  drawLetterhead(doc, W);

  // ── Report title ───────────────────────────────────────────────────────────
  let curY = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setTextColor(doc, C.black);
  doc.text(sanitizeForPdf(config.reportTitle), 14, curY);
  curY += 7;

  if (config.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setTextColor(doc, C.darkGray);
    doc.text(sanitizeForPdf(config.subtitle), 14, curY);
    curY += 6;
  }

  curY += 3; // gap before meta block

  // ── Metadata block ─────────────────────────────────────────────────────────
  const metaBottom = drawMeta(doc, W, curY, config.meta);
  const tableStartY = metaBottom + 6;

  // ── Data table ─────────────────────────────────────────────────────────────
  const isWide = config.headers.length > 8;
  const headFontSize = isWide ? 6.5 : 8.5;
  const bodyFontSize = isWide ? 6 : 8;
  const cellPad = isWide ? 2 : 3;

  // Give more width to text-heavy columns by header name
  const columnStyles: Record<number, { cellWidth?: number; minCellWidth?: number }> = {};
  config.headers.forEach((h, i) => {
    const lower = h.toLowerCase();
    if (lower.includes('descripcion') || lower.includes('motivo')) {
      columnStyles[i] = { minCellWidth: isWide ? 35 : 30 };
    }
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [config.headers.map(h => sanitizeForPdf(h))],
    body: config.rows.map(row => row.map(cell => sanitizeForPdf(cell))),
    theme: 'grid',
    headStyles: {
      fillColor: C.black,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: headFontSize,
      cellPadding: cellPad + 0.5,
    },
    bodyStyles: {
      fontSize: bodyFontSize,
      textColor: C.darkGray,
      cellPadding: cellPad,
    },
    columnStyles,
    alternateRowStyles: {
      fillColor: C.rowAlt,
    },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.15,
    margin: { left: 10, right: 10, bottom: 20 },
    styles: { overflow: 'linebreak' },
  });

  // ── Footers on every page ──────────────────────────────────────────────────
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, W, H, i, totalPages);
  }

  doc.save(config.filename);
}

// ─── Dept-grouped payroll PDF ─────────────────────────────────────────────────

export interface DeptGroupRow {
  deptName:   string;
  students:   {
    name:   string;
    carnet: string;
    hours:  string;
    bruto:  string;
    tithe:  string;
    neto:   string;
  }[];
  totalHours: string;
  totalBruto: string;
  totalTithe: string;
  totalNeto:  string;
}

/**
 * Generates a PDF with one section per department.
 * Each section has a dark header row, then student rows, then a totals footer.
 */
export function renderDeptGroupedPDF(config: {
  filename:    string;
  reportTitle: string;
  subtitle?:   string;
  meta:        PDFMetaItem[];
  deptGroups:  DeptGroupRow[];
  grandTotals: { hours: string; bruto: string; tithe: string; neto: string };
}): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W   = doc.internal.pageSize.getWidth();
  const H   = doc.internal.pageSize.getHeight();

  drawLetterhead(doc, W);

  // Title
  let curY = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setTextColor(doc, C.black);
  doc.text(sanitizeForPdf(config.reportTitle), 14, curY);
  curY += 7;

  if (config.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setTextColor(doc, C.darkGray);
    doc.text(sanitizeForPdf(config.subtitle), 14, curY);
    curY += 6;
  }
  curY += 3;

  // Meta block
  curY = drawMeta(doc, W, curY, config.meta) + 6;

  // Column headers used in every dept section
  const headers = ['Estudiante', 'Carnet', 'Horas', 'Bruto', 'Diezmo', 'Neto'];
  const colWidths = [55, 25, 16, 28, 28, 28]; // mm, sums ~ 180

  // Draw each dept section
  for (const dept of config.deptGroups) {
    // Section header bar
    const headerH = 8;
    setFill(doc, [40, 40, 45]);
    doc.rect(10, curY, W - 20, headerH, 'F');
    setTextColor(doc, C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(sanitizeForPdf(dept.deptName).toUpperCase(), 14, curY + 5.5);
    curY += headerH;

    // Table for this dept
    const rows: string[][] = dept.students.map(s => [
      sanitizeForPdf(s.name), s.carnet, s.hours,
      sanitizeForPdf(s.bruto), sanitizeForPdf(s.tithe), sanitizeForPdf(s.neto),
    ]);
    // Totals row
    rows.push(['TOTAL', '', dept.totalHours,
      sanitizeForPdf(dept.totalBruto), sanitizeForPdf(dept.totalTithe), sanitizeForPdf(dept.totalNeto)]);

    autoTable(doc, {
      startY: curY,
      head:   [headers],
      body:   rows,
      theme:  'grid',
      headStyles: {
        fillColor:  C.black,
        textColor:  C.white,
        fontStyle:  'bold',
        fontSize:   7.5,
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize:    7.5,
        textColor:   C.darkGray,
        cellPadding: 2.5,
      },
      alternateRowStyles: { fillColor: C.rowAlt },
      // Bold the last row (totals)
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

    // Page break safety margin
    if (curY > H - 40 && dept !== config.deptGroups[config.deptGroups.length - 1]) {
      doc.addPage();
      curY = 20;
    }
  }

  // Grand totals
  if (config.deptGroups.length > 0) {
    curY += 2;
    autoTable(doc, {
      startY: curY,
      head:   [['TOTALES GENERALES', '', 'Horas', 'Bruto', 'Diezmo', 'Neto']],
      body:   [['', '', config.grandTotals.hours,
        sanitizeForPdf(config.grandTotals.bruto),
        sanitizeForPdf(config.grandTotals.tithe),
        sanitizeForPdf(config.grandTotals.neto)]],
      theme:  'grid',
      headStyles: { fillColor: C.black, textColor: C.white, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
      bodyStyles: { fontStyle: 'bold', fontSize: 8, cellPadding: 3, textColor: C.darkGray },
      columnStyles: colWidths.reduce<Record<number, { cellWidth: number }>>(
        (acc, w, i) => { acc[i] = { cellWidth: w }; return acc; }, {},
      ),
      margin: { left: 10, right: 10, bottom: 20 },
    });
  }

  // Footers
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, W, H, i, totalPages);
  }

  doc.save(config.filename);
}
