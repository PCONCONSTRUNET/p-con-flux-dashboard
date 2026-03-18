import { useRef, useState } from 'react';
import { Download, Upload, FileText, FileSpreadsheet, X } from 'lucide-react';

interface ExportImportBarProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onImportFile: (file: File) => void;
  importLabel?: string;
}

export default function ExportImportBar({ onExportPDF, onExportExcel, onImportFile, importLabel = 'Importar' }: ExportImportBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showExport, setShowExport] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowExport(!showExport)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-display font-semibold tracking-wider bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all"
        >
          <Download size={13} />
          Exportar
        </button>
        {showExport && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-border/30 shadow-xl p-1" style={{ background: 'hsl(240, 6%, 10%)' }}>
              <button
                onClick={() => { onExportPDF(); setShowExport(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-foreground hover:bg-muted/30 transition-colors"
              >
                <FileText size={14} className="text-secondary" />
                Exportar PDF
              </button>
              <button
                onClick={() => { onExportExcel(); setShowExport(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-foreground hover:bg-muted/30 transition-colors"
              >
                <FileSpreadsheet size={14} className="text-emerald-400" />
                Exportar Excel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Import */}
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-display font-semibold tracking-wider bg-muted/20 text-muted-foreground border border-border/30 hover:bg-muted/30 hover:text-foreground transition-all"
      >
        <Upload size={13} />
        {importLabel}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv,.pdf"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
