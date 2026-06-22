// Build downloadable files (CSV / XLSX / PDF) from a column+row spec.
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

export function toCsv(columns, rows) {
  const head = columns.map((c) => esc(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(',')).join('\n');
  return head + '\n' + body;
}

export async function toXlsx(columns, rows, { sheet = 'Sheet1' } = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Maxx';
  wb.created = new Date();
  const ws = wb.addWorksheet(sheet.slice(0, 28) || 'Data');
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 18 }));
  rows.forEach((r) => ws.addRow(r));
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4FB3BF' } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function toPdf(columns, rows, { title = 'Export', meta = '' } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Diagonal watermark for brand protection.
    doc.save();
    doc.rotate(-30, { origin: [420, 300] }).fontSize(70).fillColor('#e6f4f6').opacity(0.6).text('AL RAFIQ', 150, 280);
    doc.opacity(1).restore();

    doc.fillColor('#0f172a').fontSize(16).text(title);
    doc.fontSize(8).fillColor('#64748b').text(meta);
    doc.moveDown(0.4);

    const cols = columns.slice(0, 8); // keep within landscape width
    const startX = 30;
    const colW = (doc.page.width - 60) / cols.length;
    let y = doc.y + 4;
    doc.fontSize(8).fillColor('#0f172a');
    cols.forEach((c, i) => doc.text(String(c.header), startX + i * colW, y, { width: colW - 4, ellipsis: true }));
    y += 14; doc.moveTo(30, y).lineTo(doc.page.width - 30, y).strokeColor('#cbd5e1').stroke(); y += 4;

    rows.slice(0, 500).forEach((r) => {
      if (y > doc.page.height - 40) { doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 }); y = 40; }
      cols.forEach((c, i) => doc.fillColor('#334155').fontSize(7).text(String(r[c.key] ?? ''), startX + i * colW, y, { width: colW - 4, ellipsis: true, height: 10 }));
      y += 13;
    });
    doc.end();
  });
}
