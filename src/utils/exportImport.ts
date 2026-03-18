import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportColumn {
  header: string;
  key: string;
}

export function exportToPDF(
  title: string,
  columns: ExportColumn[],
  data: Record<string, any>[],
  filename: string
) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text(title, 14, 20);

  // Subtitle with date
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exportado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 28);

  // Table
  autoTable(doc, {
    startY: 34,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => String(row[c.key] ?? ''))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 30, 35], textColor: [200, 200, 200], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 248] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}

export function exportToExcel(
  columns: ExportColumn[],
  data: Record<string, any>[],
  filename: string,
  sheetName = 'Dados'
) {
  const wsData = [
    columns.map(c => c.header),
    ...data.map(row => columns.map(c => row[c.key] ?? '')),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function importFromExcel(
  file: File,
  onData: (rows: Record<string, string>[]) => void
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const wb = XLSX.read(data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
    onData(json);
  };
  reader.readAsArrayBuffer(file);
}

export function importFromCSV(
  file: File,
  onData: (rows: Record<string, string>[]) => void
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const wb = XLSX.read(text, { type: 'string' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
    onData(json);
  };
  reader.readAsText(file);
}
