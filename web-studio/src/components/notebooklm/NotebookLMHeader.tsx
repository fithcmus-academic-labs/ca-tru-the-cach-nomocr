import React from 'react';
import { 
  Sparkles, 
  Upload, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  CheckCircle2,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useDocumentStore } from '../../store/useDocumentStore';

interface NotebookLMHeaderProps {
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenPageDrawer: () => void;
  onOpenHotkeys: () => void;
}

export const NotebookLMHeader: React.FC<NotebookLMHeaderProps> = ({
  onOpenUpload,
  onOpenExport,
  onOpenPageDrawer,
  onOpenHotkeys
}) => {
  const { metadata, metrics } = useProjectStore();
  const { currentPageNumber, setCurrentPageNumber, pages } = useDocumentStore();

  const handlePrevPage = () => {
    if (currentPageNumber > 1) {
      setCurrentPageNumber(currentPageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageNumber < pages.length) {
      setCurrentPageNumber(currentPageNumber + 1);
    }
  };

  return (
    <header className="h-16 px-6 bg-[#f0f4f9] border-b border-slate-200/70 flex items-center justify-between select-none shrink-0 z-30">
      {/* 1. Left: Notebook Brand & Document Title */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              {metadata.bookName}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full font-mono">
              AB 160
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            NotebookLM Sino-Nom Parallel Corpus Studio
          </span>
        </div>
      </div>

      {/* 2. Center: Clean NotebookLM-style Page Selector Pill */}
      <div className="flex items-center space-x-1.5 bg-white border border-slate-200/80 shadow-xs rounded-full px-2 py-1">
        <button
          onClick={handlePrevPage}
          disabled={currentPageNumber <= 1}
          className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenPageDrawer}
          className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded-full transition"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Trang {currentPageNumber} / {pages.length}</span>
        </button>

        <button
          onClick={handleNextPage}
          disabled={currentPageNumber >= pages.length}
          className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Right: Quick Eval pill + Actions */}
      <div className="flex items-center space-x-3">
        {/* Similarity Score Pill */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200/80 shadow-xs rounded-full">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-slate-600 font-medium">Độ tương đồng:</span>
          <span className="text-xs font-bold text-emerald-700 font-mono">
            {metrics.similarityScore.toFixed(2)}%
          </span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full">
            ĐẠT CHUẨN
          </span>
        </div>

        {/* Hotkeys */}
        <button
          onClick={onOpenHotkeys}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-full transition border border-transparent hover:border-slate-200"
          title="Phím tắt (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Upload Source */}
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2 rounded-full border border-slate-200/80 shadow-xs transition"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Thêm nguồn (PDF)</span>
        </button>

        {/* Primary Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center space-x-2 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-full shadow-sm hover:shadow transition"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Xuất File Nộp (.ZIP)</span>
        </button>
      </div>
    </header>
  );
};
