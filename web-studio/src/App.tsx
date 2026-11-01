import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { HotkeyModal } from './components/layout/HotkeyModal';
import { PipelineBanner } from './components/dashboard/PipelineBanner';
import { DocumentSidebar } from './components/editor/DocumentSidebar';
import { CanvasToolbar } from './components/editor/CanvasToolbar';
import { CanvasViewer } from './components/editor/CanvasViewer';
import { AlignmentGrid } from './components/editor/AlignmentGrid';
import { EditRecordModal } from './components/editor/EditRecordModal';
import { UploadModal } from './components/dashboard/UploadModal';
import { ExportModal } from './components/export/ExportModal';

import { useAnnotationStore } from './store/useAnnotationStore';
import { useAlignmentStore } from './store/useAlignmentStore';
import { useDocumentStore } from './store/useDocumentStore';
import { useProjectStore } from './store/useProjectStore';

export const App: React.FC = () => {
  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHotkeysOpen, setIsHotkeysOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Canvas viewport state
  const [zoom, setZoom] = useState(0.48); // Initial comfortable fit for 1400x1800 scan image
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
    // If typing in an input or textarea, ignore single-key hotkeys
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
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditModalOpen(true);
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
      {/* 1. Header with Metadata, Metrics & Actions */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenHotkeys={() => setIsHotkeysOpen(true)}
      />

      {/* 2. Pipeline 6-Stage Progress Monitoring Banner */}
      <PipelineBanner />

      {/* 3. Main Tri-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Document Sidebar */}
        <DocumentSidebar />

        {/* Pane 2: Scan Viewer & Annotation Canvas */}
        <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden relative">
          <CanvasToolbar
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

        {/* Pane 3: Alignment Data Grid */}
        <div className="w-[580px] shrink-0 flex flex-col overflow-hidden bg-white">
          <AlignmentGrid onOpenEditModal={() => setIsEditModalOpen(true)} />
        </div>
      </div>

      {/* 4. Bottom Status Bar */}
      <StatusBar zoomLevel={zoom} />

      {/* Modals */}
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <HotkeyModal isOpen={isHotkeysOpen} onClose={() => setIsHotkeysOpen(false)} />
      <EditRecordModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
};

export default App;
