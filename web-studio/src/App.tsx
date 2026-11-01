import React, { useState, useEffect, useCallback } from 'react';
import { NotebookLMHeader } from './components/notebooklm/NotebookLMHeader';
import { NotebookLMSourceViewer } from './components/notebooklm/NotebookLMSourceViewer';
import { NotebookLMEvalCard } from './components/notebooklm/NotebookLMEvalCard';
import { NotebookLMCenterStudio } from './components/notebooklm/NotebookLMCenterStudio';
import { SimplePageDrawer } from './components/editor/SimplePageDrawer';
import { SimpleExportModal } from './components/export/SimpleExportModal';
import { UploadModal } from './components/dashboard/UploadModal';
import { HotkeyModal } from './components/layout/HotkeyModal';

import { useAnnotationStore } from './store/useAnnotationStore';
import { useAlignmentStore } from './store/useAlignmentStore';
import { useDocumentStore } from './store/useDocumentStore';
import { useProjectStore } from './store/useProjectStore';

export const App: React.FC = () => {
  // Modal & Drawer states
  const [isPageDrawerOpen, setIsPageDrawerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHotkeysOpen, setIsHotkeysOpen] = useState(false);

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
    selectedSentenceId,
    setFilterStatus
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
    <div className="h-screen w-screen flex flex-col bg-[#f0f4f9] overflow-hidden font-sans">
      {/* 1. NotebookLM Minimalist Header */}
      <NotebookLMHeader
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenPageDrawer={() => setIsPageDrawerOpen(true)}
        onOpenHotkeys={() => setIsHotkeysOpen(true)}
      />

      {/* 2. Main NotebookLM Studio Workspace */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Card: Source Manuscript Page */}
        <div className="w-[45%] flex flex-col overflow-hidden">
          <NotebookLMSourceViewer
            zoom={zoom}
            panX={panX}
            panY={panY}
            isPanMode={isPanMode}
            onZoomIn={() => setZoom(z => Math.min(z * 1.15, 4.0))}
            onZoomOut={() => setZoom(z => Math.max(z * 0.85, 0.2))}
            onFitScreen={() => {
              setZoom(0.48);
              setPanX(40);
              setPanY(20);
            }}
            onTogglePanMode={() => setIsPanMode(!isPanMode)}
            onUpdateTransform={handleUpdateTransform}
          />
        </div>

        {/* Right Card: Studio with Eval Overview Card on Top & Parallel Notes below */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Top: Evaluation Result Card (NotebookLM Guide Style) */}
          <NotebookLMEvalCard
            onOpenExport={() => setIsExportOpen(true)}
            onFilterRedOnly={() => setFilterStatus('mismatch_only')}
          />

          {/* Bottom: Parallel Corpus Studio Table with Direct Inline Editing */}
          <NotebookLMCenterStudio />
        </div>
      </div>

      {/* 3. Slide-over Drawer & Modals */}
      <SimplePageDrawer
        isOpen={isPageDrawerOpen}
        onClose={() => setIsPageDrawerOpen(false)}
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
    </div>
  );
};

export default App;
