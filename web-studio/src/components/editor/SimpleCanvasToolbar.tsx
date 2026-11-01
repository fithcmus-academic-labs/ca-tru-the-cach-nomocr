import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Eye, 
  PlusSquare, 
  Trash2,
  Hand
} from 'lucide-react';
import { useAnnotationStore } from '../../store/useAnnotationStore';

interface SimpleCanvasToolbarProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onResetZoom: () => void;
  isPanMode: boolean;
  onTogglePanMode: () => void;
}

export const SimpleCanvasToolbar: React.FC<SimpleCanvasToolbarProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onResetZoom,
  isPanMode,
  onTogglePanMode
}) => {
  const { 
    visibleRegion, 
    setVisibleRegion, 
    selectedBoxId, 
    deleteBox, 
    isDrawingMode, 
    setIsDrawingMode 
  } = useAnnotationStore();

  return (
    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 select-none">
      {/* Left: Floating Zoom Controls */}
      <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-md rounded-xl p-1 pointer-events-auto">
        <button
          onClick={onZoomOut}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          title="Thu nhỏ (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-bold text-slate-700 w-12 text-center">
          {Math.round(zoomLevel * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          title="Phóng to (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        <button
          onClick={onFitScreen}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          title="Vừa trang (Phím 0)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePanMode}
          className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-lg transition ${
            isPanMode
              ? 'bg-emerald-100 text-emerald-800 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Công cụ Di chuyển (Giữ phím Space hoặc bấm)"
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Kéo</span>
        </button>
      </div>

      {/* Right: Floating Region & Box Controls */}
      <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-md rounded-xl p-1 pointer-events-auto">
        {/* Toggle Region Buttons */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setVisibleRegion('all')}
            className={`px-2 py-0.5 rounded-md transition ${
              visibleRegion === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả khung
          </button>
          <button
            onClick={() => setVisibleRegion('ch')}
            className={`px-2 py-0.5 rounded-md transition ${
              visibleRegion === 'ch'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            Chữ Nôm
          </button>
          <button
            onClick={() => setVisibleRegion('vi')}
            className={`px-2 py-0.5 rounded-md transition ${
              visibleRegion === 'vi'
                ? 'bg-blue-600 text-white'
                : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            Quốc ngữ
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Add 4-Point Box */}
        <button
          onClick={() => setIsDrawingMode(!isDrawingMode)}
          className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg transition ${
            isDrawingMode
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
          }`}
          title="Vẽ thêm bounding box 4 điểm"
        >
          <PlusSquare className="w-3.5 h-3.5" />
          <span>{isDrawingMode ? 'Đang vẽ...' : '+ Vẽ khung'}</span>
        </button>

        {/* Delete selected box */}
        {selectedBoxId && (
          <button
            onClick={() => deleteBox(selectedBoxId)}
            className="flex items-center space-x-1 text-xs px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-medium transition"
            title="Xoá khung đang chọn (Delete)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Xoá</span>
          </button>
        )}
      </div>
    </div>
  );
};
