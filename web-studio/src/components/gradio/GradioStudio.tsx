import React, { useState, useEffect } from 'react';
import { Block1Upload } from './Block1Upload';
import { Block2Terminal } from './Block2Terminal';
import { Block3Workspace } from './Block3Workspace';
import { Block4EvaluationAudit } from './Block4EvaluationAudit';
import { Block5DataGrid } from './Block5DataGrid';
import { Block4Export } from './Block4Export';

import { useAnnotationStore } from '../../store/useAnnotationStore';
import { useAlignmentStore } from '../../store/useAlignmentStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useProjectStore } from '../../store/useProjectStore';
import { BOOK_OPTIONS, BookKey, matchBookKeyFromFilename } from '../../services/realDataset';

export const GradioStudio: React.FC = () => {
  const { metadata, isBackendConnected, activeBookKey, switchBook } = useProjectStore();
  const { pages, currentPageNumber, setCurrentPageNumber, getCurrentPage } = useDocumentStore();
  const { boxes, loadBoxesForPage } = useAnnotationStore();
  const {
    records,
    selectedSentenceId,
    setSelectedSentenceId,
    updateRecordText
  } = useAlignmentStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineFinished, setPipelineFinished] = useState(false);
  const [uploadedPdfName, setUploadedPdfName] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'mismatch_only' | 'current_page'>('all');

  const currentPage = getCurrentPage();
  const currentImageUrl =
    currentPage?.imageUrl ||
    `/dataset/${activeBookKey}/page_${String(currentPageNumber).padStart(3, '0')}.jpg`;

  // Load boxes when page or book changes
  useEffect(() => {
    if (pipelineFinished) {
      loadBoxesForPage(metadata.id, currentPageNumber);
    }
  }, [pipelineFinished, currentPageNumber, metadata.id, loadBoxesForPage]);

  // When user uploads a new PDF file or selects sample
  const handleFileUploaded = (file: { name: string; bookKey?: BookKey }) => {
    const targetKey = file.bookKey || matchBookKeyFromFilename(file.name);
    switchBook(targetKey);
    setUploadedPdfName(file.name);
    setIsProcessing(true);
    setPipelineFinished(false);
  };

  const handlePipelineComplete = () => {
    setIsProcessing(false);
    setPipelineFinished(true);
  };

  const handleManualSwitchBook = (key: BookKey) => {
    switchBook(key);
    const opt = BOOK_OPTIONS.find((b) => b.key === key);
    if (opt) {
      setUploadedPdfName(opt.pdfName);
    }
  };

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

  const handleJumpToDataGrid = () => {
    document.getElementById('block-5-datagrid')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectPageAndScroll = (pNum: number) => {
    setCurrentPageNumber(pNum);
    document.getElementById('block-3-imageviewer')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Minimalist Header */}
        <div className="border-b-2 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-black">
              Sino-Nom Parallel Corpus Processing Studio
            </h1>
            <p className="text-xs font-mono text-gray-600 mt-1">
              Hệ thống xử lý & đối chiếu ngữ liệu song song Hán Nôm - Quốc ngữ (Human-in-the-Loop)
            </p>
          </div>
          <div className="text-xs font-mono text-gray-700">
            {uploadedPdfName ? `[TẬP TIN: ${uploadedPdfName}]` : '[CHƯA TẢI TÀI LIỆU]'}
          </div>
        </div>

        {/* Quick Book Selector Toolbar (When document loaded) */}
        {pipelineFinished && (
          <div className="bg-white border border-gray-300 p-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span className="font-bold text-gray-700">CHỌN SÁCH:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {BOOK_OPTIONS.map((opt) => {
                const isActive = activeBookKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleManualSwitchBook(opt.key)}
                    className={`px-3 py-1 border transition ${
                      isActive
                        ? 'bg-black text-white border-black font-bold'
                        : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    [ {opt.key}: {opt.pages} TRANG ]
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. Block 1: Upload (Tải tài liệu) */}
        <section id="block-1-upload">
          <Block1Upload
            onFileUploaded={handleFileUploaded}
            isProcessing={isProcessing}
            uploadedFileName={uploadedPdfName}
            activeBookKey={activeBookKey}
          />
        </section>

        {/* 2. Block 2: Terminal Console (Log hệ thống) */}
        <section id="block-2-terminal">
          <Block2Terminal
            isProcessing={isProcessing}
            onPipelineComplete={handlePipelineComplete}
            fileName={uploadedPdfName || `${metadata.bookName}.pdf`}
            totalPages={pages.length}
          />
        </section>

        {/* 3. Block 3: Scan & Annotation Viewer (Soi ảnh scan & BBoxes) */}
        {pipelineFinished && (
          <section id="block-3-imageviewer">
            <Block3Workspace
              currentPageNumber={currentPageNumber}
              totalPages={pages.length}
              pages={pages}
              boxes={boxes}
              currentImageUrl={currentImageUrl}
              selectedSentenceId={selectedSentenceId}
              onSelectSentence={setSelectedSentenceId}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              onSelectPage={setCurrentPageNumber}
            />
          </section>
        )}

        {/* 4. Block 4: Evaluation & Audit (Kiểm tra tiến độ, sót trang, phân loại trang dịch vs bìa) */}
        {pipelineFinished && (
          <section id="block-4-eval-audit">
            <Block4EvaluationAudit
              records={records}
              pages={pages}
              currentPageNumber={currentPageNumber}
              onSelectPage={handleSelectPageAndScroll}
              onJumpToDataGrid={handleJumpToDataGrid}
            />
          </section>
        )}

        {/* 5. Block 5: Data Grid (Bảng dữ liệu 4 cột cố định) */}
        {pipelineFinished && (
          <section id="block-5-datagrid">
            <Block5DataGrid
              records={records}
              selectedSentenceId={selectedSentenceId}
              onSelectSentence={setSelectedSentenceId}
              onUpdateRecord={updateRecordText}
              filterMode={filterMode}
              onFilterChange={setFilterMode}
              currentPageNumber={currentPageNumber}
            />
          </section>
        )}

        {/* 6. Block 6: Export (Xuất gói zip bàn giao học thuật) */}
        {pipelineFinished && (
          <section id="block-6-export">
            <Block4Export
              metadata={metadata}
              pages={pages}
              boxes={boxes}
              records={records}
              isBackendConnected={isBackendConnected}
            />
          </section>
        )}
      </div>
    </div>
  );
};
