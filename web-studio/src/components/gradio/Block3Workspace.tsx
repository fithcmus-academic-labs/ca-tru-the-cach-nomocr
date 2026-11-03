import React, { useState } from 'react';
import { CanvasImageViewer } from './CanvasImageViewer';
import { BoundingBox } from '../../types/annotation';
import { PageDocument } from '../../types/document';
import { apiAdapter, CloudOcrResult } from '../../services/apiAdapter';

interface Block3WorkspaceProps {
  currentPageNumber: number;
  totalPages: number;
  pages: PageDocument[];
  boxes: BoundingBox[];
  currentImageUrl: string;
  selectedSentenceId: string | null;
  onSelectSentence: (sentenceId: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSelectPage: (pageNumber: number) => void;
}

export const Block3Workspace: React.FC<Block3WorkspaceProps> = ({
  currentPageNumber,
  totalPages,
  pages,
  boxes,
  currentImageUrl,
  selectedSentenceId,
  onSelectSentence,
  onPrevPage,
  onNextPage,
  onSelectPage
}) => {
  const currentPage = pages.find((p) => p.pageNumber === currentPageNumber);
  const isContent = currentPage?.category === 'content';

  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<CloudOcrResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const handleRunCloudOcr = async () => {
    setIsOcrLoading(true);
    setOcrError(null);
    try {
      if (apiAdapter.runCloudOcr) {
        const res = await apiAdapter.runCloudOcr(currentPageNumber);
        setOcrResult(res);
      }
    } catch (err: any) {
      setOcrError(err?.message || 'Lỗi khi gọi KimHanNom Cloud OCR');
    } finally {
      setIsOcrLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-300 p-6 space-y-4">
      {/* 1. Header */}
      <div className="border-b border-gray-300 pb-2.5 flex items-center justify-between gap-2 font-mono text-xs">
        <h2 className="text-sm font-bold text-gray-900 uppercase">
          3. Image Viewer & Bounding Boxes
        </h2>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-2 py-0.5 bg-gray-100 border border-gray-400 font-bold text-black">
            TYPE: {(currentPage?.category || 'CONTENT').toUpperCase()}
          </span>
          <span className="px-2 py-0.5 bg-black text-white font-bold border border-black">
            {isContent ? '[ TRANG DỊCH ]' : '[ TRANG BÌA/PHỤ ]'}
          </span>
        </div>
      </div>

      {/* 2. Page Navigation Bar with Cloud OCR Trigger */}
      <div className="flex flex-wrap items-center justify-between bg-gray-100 p-2 border border-gray-300 font-mono text-xs gap-2">
        <div className="font-bold text-gray-800">
          DOCUMENT NAVIGATOR: PAGE {currentPageNumber} OF {totalPages}
        </div>

        <div className="flex flex-wrap items-center space-x-2">
          <button
            onClick={onPrevPage}
            disabled={currentPageNumber <= 1}
            className="px-3 py-1 bg-white border border-gray-400 hover:bg-gray-200 disabled:opacity-40 font-bold"
          >
            [ &lt; Previous Page ]
          </button>
          <span className="font-bold px-2">Page {currentPageNumber} / {totalPages}</span>
          <button
            onClick={onNextPage}
            disabled={currentPageNumber >= totalPages}
            className="px-3 py-1 bg-white border border-gray-400 hover:bg-gray-200 disabled:opacity-40 font-bold"
          >
            [ Next Page &gt; ]
          </button>
          <button
            onClick={handleRunCloudOcr}
            disabled={isOcrLoading}
            className="px-3 py-1 bg-black text-white hover:bg-gray-800 disabled:opacity-50 font-bold border border-black transition"
          >
            {isOcrLoading ? '[ Đang gọi KimHanNom OCR... ]' : '[ Chạy KimHanNom Cloud OCR & Dịch âm ]'}
          </button>
        </div>
      </div>

      {/* Cloud OCR Results Notification Box */}
      {ocrResult && (
        <div className="p-3 bg-gray-50 border border-black font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-gray-300 pb-1">
            <span className="font-bold text-black">
              [KIMHANNOM CLOUD OCR KẾT QUẢ]: Server ID: {ocrResult.server_file_name} | {ocrResult.total_lines} dòng phát hiện
            </span>
            <button
              onClick={() => setOcrResult(null)}
              className="text-gray-500 hover:text-black font-bold px-1"
            >
              [ĐÓNG]
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {ocrResult.lines.slice(0, 5).map((l) => (
              <div key={l.line_id} className="text-[11px] text-gray-800">
                <span className="font-bold text-black">Dòng {l.line_id}:</span> {l.nom_text} &rarr; <span className="font-semibold text-emerald-800">{l.quocngu_transcription}</span>
              </div>
            ))}
            {ocrResult.lines.length > 5 && (
              <div className="text-[10px] text-gray-500">
                ... và {ocrResult.lines.length - 5} dòng khác đã được nhận diện và dịch âm.
              </div>
            )}
          </div>
        </div>
      )}

      {ocrError && (
        <div className="p-2.5 bg-red-50 border border-red-500 text-red-700 font-mono text-xs flex items-center justify-between">
          <span>[LỖI CLOUD OCR] {ocrError}</span>
          <button onClick={() => setOcrError(null)} className="font-bold">[ĐÓNG]</button>
        </div>
      )}

      {/* 3. Full-Width Image Viewer with Strictly 4-Point Bounding Boxes & Page Filter */}
      <div className="w-full min-h-[640px]">
        <CanvasImageViewer
          imageUrl={currentImageUrl}
          pageNumber={currentPageNumber}
          totalPages={totalPages}
          pages={pages}
          boxes={boxes}
          selectedSentenceId={selectedSentenceId}
          onSelectSentence={onSelectSentence}
          onSelectPage={onSelectPage}
        />
      </div>
    </div>
  );
};
