import React from 'react';
import { 
  BookOpen, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Cpu,
  Save,
  HelpCircle
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAlignmentStore } from '../../store/useAlignmentStore';
import { useDocumentStore } from '../../store/useDocumentStore';

interface SimpleHeaderProps {
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenPipeline: () => void;
  onOpenHotkeys: () => void;
  isPageDrawerOpen: boolean;
  onTogglePageDrawer: () => void;
}

export const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  onOpenUpload,
  onOpenExport,
  onOpenPipeline,
  onOpenHotkeys,
  isPageDrawerOpen,
  onTogglePageDrawer
}) => {
  const { metadata, metrics } = useProjectStore();
  const { hasUnsavedChanges, saveChanges } = useAlignmentStore();
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
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-xs select-none shrink-0 z-30">
      {/* 1. Left: Book Info & Page Drawer Toggle */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg shadow-xs">
          <BookOpen className="w-4 h-4" />
          <span className="font-bold text-xs tracking-wide">Hán Nôm Studio</span>
        </div>

        <button
          onClick={onTogglePageDrawer}
          className={`flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${
            isPageDrawerOpen
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="Bật/Tắt danh sách 45 trang"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Danh sách trang</span>
          <span className="bg-slate-200/80 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {pages.length}
          </span>
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* Current Book Name */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-900">{metadata.bookName}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
              AB 160
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center: Page Navigator & Quick Jump */}
      <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
        <button
          onClick={handlePrevPage}
          disabled={currentPageNumber <= 1}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1 text-xs">
          <span className="text-slate-500 font-medium">Trang:</span>
          <select
            value={currentPageNumber}
            onChange={(e) => setCurrentPageNumber(Number(e.target.value))}
            className="font-bold text-slate-900 bg-transparent text-xs cursor-pointer focus:outline-none"
          >
            {pages.map((p) => (
              <option key={p.pageNumber} value={p.pageNumber}>
                {p.pageNumber} / {pages.length} {p.category !== 'content' ? `(${p.category})` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPageNumber >= pages.length}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Right: Similarity Metric, Pipeline & Actions */}
      <div className="flex items-center space-x-3">
        {/* Similarity Score Pill */}
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="text-xs text-slate-600 font-medium">Độ tương đồng:</span>
          <span className="text-sm font-extrabold text-emerald-700 font-mono">
            {metrics.similarityScore.toFixed(2)}%
          </span>
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ĐẠT CHUẨN</span>
          </span>
        </div>

        {/* Pipeline Monitor Button */}
        <button
          onClick={onOpenPipeline}
          className="flex items-center space-x-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
          title="Xem chi tiết 6 công đoạn NLP"
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium">Tiến trình (6/6)</span>
        </button>

        {/* Unsaved Changes indicator */}
        {hasUnsavedChanges && (
          <button
            onClick={() => saveChanges()}
            className="flex items-center space-x-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium px-2.5 py-1.5 rounded-lg shadow-2xs transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu thay đổi</span>
          </button>
        )}

        {/* Shortcuts helper */}
        <button
          onClick={onOpenHotkeys}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          title="Phím tắt (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Tải PDF</span>
        </button>

        {/* Primary Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-xs hover:shadow transition"
        >
          <Download className="w-4 h-4" />
          <span>Xuất file nộp (ZIP)</span>
        </button>
      </div>
    </header>
  );
};
