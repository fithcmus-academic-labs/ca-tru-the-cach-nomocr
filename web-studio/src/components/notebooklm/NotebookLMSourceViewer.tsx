import React from 'react';
import { 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Eye, 
  EyeOff, 
  Hand,
  Layers
} from 'lucide-react';
import { CanvasViewer } from '../editor/CanvasViewer';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAnnotationStore } from '../../store/useAnnotationStore';

interface NotebookLMSourceViewerProps {
  zoom: number;
  panX: number;
  panY: number;
  isPanMode: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onTogglePanMode: () => void;
  onUpdateTransform: (zoom: number, panX: number, panY: number) => void;
}

export const NotebookLMSourceViewer: React.FC<NotebookLMSourceViewerProps> = ({
  zoom,
  panX,
  panY,
  isPanMode,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onTogglePanMode,
  onUpdateTransform
}) => {
  const { currentPageNumber, getCurrentPage } = useDocumentStore();
  const { visibleRegion, setVisibleRegion, boxes } = useAnnotationStore();
  const currentPage = getCurrentPage();

  const isBoxesVisible = visibleRegion !== 'none';
  const toggleBoxes = () => {
    setVisibleRegion(isBoxesVisible ? 'none' : 'all');
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden select-none relative">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-slate-200/70 flex items-center justify-between shrink-0 bg-white z-10">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Nguồn Tài Liệu: Trang {currentPageNumber}
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono uppercase">
            {currentPage?.category || 'CONTENT'}
          </span>
        </div>

        {/* Floating Mini Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Toggle Boxes */}
          <button
            onClick={toggleBoxes}
            className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full border transition ${
              isBoxesVisible
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Bật/Tắt hiển thị Bounding Box"
          >
            {isBoxesVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isBoxesVisible ? 'Hiện khung OCR' : 'Ẩn khung'}</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-full px-1 py-0.5">
            <button
              onClick={onZoomOut}
              className="p-1 text-slate-500 hover:text-slate-800 rounded-full transition"
              title="Thu nhỏ (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-700 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="p-1 text-slate-500 hover:text-slate-800 rounded-full transition"
              title="Phóng to (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onFitScreen}
              className="p-1 text-slate-500 hover:text-slate-800 rounded-full transition"
              title="Vừa trang (0)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pan Toggle */}
          <button
            onClick={onTogglePanMode}
            className={`p-1.5 rounded-full border transition ${
              isPanMode
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title="Công cụ Di chuyển (Kéo thả)"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewer */}
      <div className="flex-1 relative overflow-hidden bg-slate-900/5">
        <CanvasViewer
          zoom={zoom}
          panX={panX}
          panY={panY}
          isPanMode={isPanMode}
          onUpdateTransform={onUpdateTransform}
          onOpenEditModal={() => {}}
        />
      </div>
    </div>
  );
};
