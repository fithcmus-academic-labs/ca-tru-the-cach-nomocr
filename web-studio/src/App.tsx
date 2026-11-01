import React, { useState, useEffect, useCallback } from 'react';
import { SimpleHeader } from './components/layout/SimpleHeader';
import { SimplePageDrawer } from './components/editor/SimplePageDrawer';
import { SimpleCanvasToolbar } from './components/editor/SimpleCanvasToolbar';
import { CanvasViewer } from './components/editor/CanvasViewer';
import { SimpleAlignmentGrid } from './components/editor/SimpleAlignmentGrid';
import { PipelineModal } from './components/dashboard/PipelineModal';
import { SimpleExportModal } from './components/export/SimpleExportModal';
import { UploadModal } from './components/dashboard/UploadModal';
import { HotkeyModal } from './components/layout/HotkeyModal';
import { EditRecordModal } from './components/editor/EditRecordModal';

import { useAnnotationStore } from './store/useAnnotationStore';
import { useAlignmentStore } from './store/useAlignmentStore';
import { useDocumentStore } from './store/useDocumentStore';
import { useProjectStore } from './store/useProjectStore';

export const App: React.FC = () => {
  // Modal & Drawer states
  const [isPageDrawerOpen, setIsPageDrawerOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHotkeysOpen, setIsHotkeysOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Canvas viewport state
  const [zoom, setZoom] = useState(0.48);
  const [panX, setPanX] = useState(40);
  const [panY, setPanY] = useState(20);
  const [isPanMode, setIsPanMode] = useState(false);

  const { loadBoxesForPage } = useAnnotationStore();
  const { currentPageNumber } = useDocumentStore();
  const { metadata } = useProjectStore();
  const { 
    selectNextMismatch, 
    selectPreviousMismatch, 
    saveChanges, 
    updateRecordReviewStatus,
    selectedSentenceId 
  } = useAlignmentStore();

  // Load annotations on mount and page switch
  useEffect(() => {
    loadBoxesForPage(metadata.id, currentPageNumber);
  }, [currentPageNumber, metadata.id, loadBoxesForPage]);

  // Global Keyboard Shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea') {
      if (e.key === 'Escape') {
        (e.target as HTMLElement).blur();
      }
      return;
    }

    if (e.key === '?') {
      e.preventDefault();
      setIsHotkeysOpen(prev => !prev);
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      selectNextMismatch();
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      selectPreviousMismatch();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      if (selectedSentenceId) {
        updateRecordReviewStatus(selectedSentenceId, 'approved');
      }
    } else if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveChanges();
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setZoom(z => Math.min(z * 1.15, 4.0));
    } else if (e.key === '-') {
      e.preventDefault();
      setZoom(z => Math.max(z * 0.85, 0.2));
    } else if (e.key === '0') {
      e.preventDefault();
      setZoom(0.48);
      setPanX(40);
      setPanY(20);
    }
  }, [selectNextMismatch, selectPreviousMismatch, saveChanges, selectedSentenceId, updateRecordReviewStatus]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleUpdateTransform = (newZoom: number, newPanX: number, newPanY: number) => {
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
      {/* 1. Sleek, Modern Top Header */}
      <SimpleHeader
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenPipeline={() => setIsPipelineOpen(true)}
        onOpenHotkeys={() => setIsHotkeysOpen(true)}
        isPageDrawerOpen={isPageDrawerOpen}
        onTogglePageDrawer={() => setIsPageDrawerOpen(prev => !prev)}
      />

      {/* 2. Main 50/50 Split Workspace (Original Scan vs Parallel Alignment Grid) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Half: Original Scan & Bounding Box Canvas */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900/5">
          <SimpleCanvasToolbar
            zoomLevel={zoom}
            onZoomIn={() => setZoom(z => Math.min(z * 1.15, 4.0))}
            onZoomOut={() => setZoom(z => Math.max(z * 0.85, 0.2))}
            onFitScreen={() => {
              setZoom(0.48);
              setPanX(40);
              setPanY(20);
            }}
            onResetZoom={() => {
              setZoom(1.0);
              setPanX(0);
              setPanY(0);
            }}
            isPanMode={isPanMode}
            onTogglePanMode={() => setIsPanMode(!isPanMode)}
          />

          <CanvasViewer
            zoom={zoom}
            panX={panX}
            panY={panY}
            isPanMode={isPanMode}
            onUpdateTransform={handleUpdateTransform}
            onOpenEditModal={() => setIsEditModalOpen(true)}
          />
        </div>

        {/* Right Half: Bilingual Alignment Grid with Direct Inline Editing */}
        <div className="w-[620px] shrink-0 flex flex-col overflow-hidden bg-white shadow-xs">
          <SimpleAlignmentGrid onOpenEditModal={() => setIsEditModalOpen(true)} />
        </div>
      </div>

      {/* 3. Slide-over & Modals */}
      <SimplePageDrawer
        isOpen={isPageDrawerOpen}
        onClose={() => setIsPageDrawerOpen(false)}
      />

      <PipelineModal
        isOpen={isPipelineOpen}
        onClose={() => setIsPipelineOpen(false)}
      />

      <SimpleExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <HotkeyModal
        isOpen={isHotkeysOpen}
        onClose={() => setIsHotkeysOpen(false)}
      />

      <EditRecordModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};

export default App;
