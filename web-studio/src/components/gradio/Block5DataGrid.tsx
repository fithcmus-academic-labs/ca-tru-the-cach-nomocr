import React from 'react';
import { BilingualDataGrid } from './BilingualDataGrid';
import { AlignmentRecord } from '../../types/alignment';

interface Block5DataGridProps {
  records: AlignmentRecord[];
  selectedSentenceId: string | null;
  onSelectSentence: (sentenceId: string) => void;
  onUpdateRecord: (sentenceId: string, newNom: string, newQn: string) => void;
  filterMode: 'all' | 'mismatch_only' | 'current_page';
  onFilterChange: (mode: 'all' | 'mismatch_only' | 'current_page') => void;
  currentPageNumber: number;
}

export const Block5DataGrid: React.FC<Block5DataGridProps> = ({
  records,
  selectedSentenceId,
  onSelectSentence,
  onUpdateRecord,
  filterMode,
  onFilterChange,
  currentPageNumber
}) => {
  return (
    <div className="w-full bg-white border border-gray-300 p-5 space-y-3 font-mono text-xs">
      {/* 1. Minimal Header */}
      <div className="border-b border-gray-300 pb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-900 uppercase">
          5. Data Grid ({records.length} Rows)
        </h2>
        <span className="px-2 py-0.5 bg-black text-white font-bold">
          TOTAL: {records.length} ROWS
        </span>
      </div>

      {/* 2. Full-Width Table */}
      <div className="w-full min-h-[580px]">
        <BilingualDataGrid
          records={records}
          selectedSentenceId={selectedSentenceId}
          onSelectSentence={onSelectSentence}
          onUpdateRecord={onUpdateRecord}
          filterMode={filterMode}
          onFilterChange={onFilterChange}
          currentPageNumber={currentPageNumber}
        />
      </div>
    </div>
  );
};
