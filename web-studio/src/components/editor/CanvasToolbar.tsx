import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  PlusSquare, 
  Trash2, 
  Eye, 
  Hand,
  MousePointer
} from 'lucide-react';
import { useAnnotationStore } from '../../store/useAnnotationStore';

interface CanvasToolbarProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onResetZoom: () => void;
  isPanMode: boolean;
  onTogglePanMode: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
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
    <div className="h-10 bg-white border-b border-slate-200 px-3 flex items-center justify-between select-none shrink-0 z-10">
      {/* Zoom controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onZoomOut}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-medium text-slate-700 w-12 text-center">
          {Math.round(zoomLevel * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          onClick={onFitScreen}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          title="Fit Page to Screen (0)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={onResetZoom}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          title="Reset to 100%"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Pan mode toggle */}
        <button
          onClick={onTogglePanMode}
          className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition ${
            isPanMode
              ? 'bg-emerald-100 text-emerald-800 font-medium'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Pan Tool (Hold Space or click)"
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Pan</span>
        </button>
      </div>

      {/* Editing tools & Region filters */}
      <div className="flex items-center space-x-2">
        {/* Region Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium">
          <button
            onClick={() => setVisibleRegion('all')}
            className={`px-2 py-0.5 rounded transition ${
              visibleRegion === 'all'
                ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Boxes
          </button>
          <button
            onClick={() => setVisibleRegion('ch')}
            className={`px-2 py-0.5 rounded transition ${
              visibleRegion === 'ch'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            Nôm (ch)
          </button>
          <button
            onClick={() => setVisibleRegion('vi')}
            className={`px-2 py-0.5 rounded transition ${
              visibleRegion === 'vi'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            Quốc ngữ (vi)
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Add 4-Point Box */}
        <button
          onClick={() => setIsDrawingMode(!isDrawingMode)}
          className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md transition ${
            isDrawingMode
              ? 'bg-emerald-600 text-white font-medium'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Draw new 4-point bounding box"
        >
          <PlusSquare className="w-3.5 h-3.5" />
          <span>{isDrawingMode ? 'Drawing Box...' : 'Add Box'}</span>
        </button>

        {/* Delete Box */}
        {selectedBoxId && (
          <button
            onClick={() => deleteBox(selectedBoxId)}
            className="flex items-center space-x-1 text-xs px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition"
            title="Delete Selected Box (Del)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
};
