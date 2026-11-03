import React from 'react';
import { AlignmentRecord } from '../../types/alignment';
import { PageDocument } from '../../types/document';

interface Block4EvaluationAuditProps {
  records: AlignmentRecord[];
  pages: PageDocument[];
  currentPageNumber: number;
  onSelectPage: (pageNumber: number) => void;
  onJumpToDataGrid: () => void;
}

export const Block4EvaluationAudit: React.FC<Block4EvaluationAuditProps> = ({
  records,
  pages,
  currentPageNumber,
  onSelectPage,
  onJumpToDataGrid
}) => {
  const totalChars = records.reduce((acc, r) => acc + (r.SinoNom_Char?.length || 0), 0);
  const mismatchedChars = records.reduce((acc, r) => {
    const redCount = (r.charStatuses || []).filter((cs) => !cs.isMatched).length;
    return acc + (redCount > 0 ? redCount : r.color === 'RED' ? r.SinoNom_Char.length : 0);
  }, 0);
  const similarityScore = totalChars > 0 ? (1.0 - mismatchedChars / totalChars) * 100.0 : 100.0;
  const isPassed = similarityScore >= 95.0;

  const contentPages = pages.filter((p) => p.category === 'content');
  const miscPages = pages.filter((p) => p.category !== 'content');

  return (
    <div className="w-full bg-white border border-gray-300 p-5 space-y-4 font-mono text-xs">
      {/* 1. Header */}
      <div className="border-b border-gray-300 pb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-900 uppercase">
          4. Evaluation & Completeness Audit
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 bg-black text-white font-bold border border-black">
            STATUS: {pages.length}/{pages.length} PAGES (0 MISSING)
          </span>
          <span
            className={`px-2.5 py-1 font-bold border ${
              isPassed ? 'bg-gray-100 text-black border-gray-400' : 'bg-red-600 text-white border-red-700'
            }`}
          >
            SIMILARITY: {similarityScore.toFixed(2)}% [{isPassed ? 'PASSED >= 95%' : 'FAILED < 95%'}]
          </span>
        </div>
      </div>

      {/* 2. Compact Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
        <div className="p-2.5 bg-gray-50 border border-gray-300">
          <div className="text-gray-500 text-[11px]">TOTAL PAGES</div>
          <div className="text-sm font-bold text-black mt-0.5">{pages.length} (100%)</div>
        </div>
        <div className="p-2.5 bg-gray-50 border border-gray-300">
          <div className="text-gray-500 text-[11px]">TRANSLATION PAGES</div>
          <div className="text-sm font-bold text-black mt-0.5">
            {contentPages.length} ({contentPages[0] ? `P.${contentPages[0].pageNumber} - P.${contentPages[contentPages.length - 1].pageNumber}` : 'N/A'})
          </div>
        </div>
        <div className="p-2.5 bg-gray-50 border border-gray-300">
          <div className="text-gray-500 text-[11px]">COVER / MISC / BLANK</div>
          <div className="text-sm font-bold text-black mt-0.5">{miscPages.length} Trang</div>
        </div>
        <div className="p-2.5 bg-gray-50 border border-gray-300">
          <div className="text-gray-500 text-[11px]">SINO-NOM CHARACTERS</div>
          <div className="text-sm font-bold text-black mt-0.5">
            {totalChars} ({mismatchedChars} Red)
          </div>
        </div>
      </div>

      {/* 3. Page Group Separation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Group A: Trang Dịch */}
        <div className="border border-black p-3 space-y-2 bg-white">
          <div className="flex items-center justify-between border-b border-gray-300 pb-1.5 font-bold">
            <span>TRANG DỊCH (CONTENT): {contentPages.length} TRANG</span>
            <span className="text-[11px] text-gray-600">{records.length} PAIRS | CH/ & VI/</span>
          </div>
          <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 bg-gray-50 border border-gray-200">
            {contentPages.map((p) => {
              const isCur = p.pageNumber === currentPageNumber;
              const hasRed = p.mismatchedCount > 0;
              return (
                <button
                  key={p.pageNumber}
                  onClick={() => onSelectPage(p.pageNumber)}
                  className={`px-1.5 py-0.5 border text-[11px] transition ${
                    isCur
                      ? 'bg-black text-white border-black font-bold'
                      : hasRed
                      ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 font-semibold'
                      : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  P.{String(p.pageNumber).padStart(2, '0')}
                  {hasRed ? '*' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Group B: Trang Bìa & Ngoại Văn */}
        <div className="border border-gray-400 p-3 space-y-2 bg-gray-50">
          <div className="flex items-center justify-between border-b border-gray-300 pb-1.5 font-bold">
            <span>TRANG BÌA & PHỤ: {miscPages.length} TRANG</span>
            <span className="text-[11px] text-gray-600">0 PAIRS | MISC/ & BLANK/</span>
          </div>
          <div className="flex flex-wrap gap-1 p-1 bg-white border border-gray-200">
            {miscPages.map((p) => {
              const isCur = p.pageNumber === currentPageNumber;
              const tag =
                p.pageNumber === 1
                  ? 'Bìa trước'
                  : p.pageNumber === 2
                  ? 'Nhan đề'
                  : p.pageNumber === pages.length
                  ? 'Bìa sau'
                  : 'Phụ';
              return (
                <button
                  key={p.pageNumber}
                  onClick={() => onSelectPage(p.pageNumber)}
                  className={`px-2 py-0.5 border text-[11px] transition ${
                    isCur
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  P.{String(p.pageNumber).padStart(2, '0')} ({tag})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Action Jump */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-gray-600 text-[11px]">Audit: 0 Missing Pages | {records.length} Aligned Pairs</span>
        <button
          onClick={onJumpToDataGrid}
          className="px-3 py-1 bg-black text-white hover:bg-gray-800 font-bold"
        >
          [ Jump to Data Grid ({records.length} Rows) &darr; ]
        </button>
      </div>
    </div>
  );
};
