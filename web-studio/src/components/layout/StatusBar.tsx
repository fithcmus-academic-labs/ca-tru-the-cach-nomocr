import React from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { useAlignmentStore } from '../../store/useAlignmentStore';

interface StatusBarProps {
  zoomLevel: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ zoomLevel }) => {
  const { currentPageNumber, pages } = useDocumentStore();
  const { boxes, selectedBoxId } = useAnnotationStore();
  const { selectedSentenceId } = useAlignmentStore();

  const currentPage = pages.find(p => p.pageNumber === currentPageNumber);

  return (
    <footer className="h-7 bg-slate-900 text-slate-300 text-xs px-3 flex items-center justify-between border-t border-slate-800 select-none z-20">
      {/* Left status details */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">Page:</span>
          <span className="font-semibold text-white">{currentPageNumber} / {pages.length}</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
            {currentPage?.category.toUpperCase()}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">Boxes:</span>
          <span className="font-semibold text-white">{boxes.length}</span>
          <span className="text-[10px] text-slate-400">
            (ch: {boxes.filter(b => b.region_type === 'ch').length}, vi: {boxes.filter(b => b.region_type === 'vi').length})
          </span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">Active Sentence:</span>
          <span className="font-mono text-emerald-400">
            {selectedSentenceId || 'None'}
          </span>
        </div>
      </div>

      {/* Right helper shortcuts & zoom */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
          <span>[↑/↓] Navigate</span>
          <span>•</span>
          <span>[N] Next Mismatch</span>
          <span>•</span>
          <span>[Enter] Edit</span>
          <span>•</span>
          <span>[R] Mark Reviewed</span>
          <span>•</span>
          <span>[Ctrl+S] Save</span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        <div className="flex items-center space-x-1 text-slate-400 font-mono">
          <span>Zoom:</span>
          <span className="text-white font-semibold">{Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>
    </footer>
  );
};
