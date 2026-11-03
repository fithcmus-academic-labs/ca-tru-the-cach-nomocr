import React, { useState } from 'react';
import { AlignmentRecord } from '../../types/alignment';

interface BilingualDataGridProps {
  records: AlignmentRecord[];
  selectedSentenceId: string | null;
  onSelectSentence: (sentenceId: string) => void;
  onUpdateRecord: (sentenceId: string, newNom: string, newQn: string) => void;
  filterMode: 'all' | 'mismatch_only' | 'current_page';
  onFilterChange: (mode: 'all' | 'mismatch_only' | 'current_page') => void;
  currentPageNumber?: number;
}

export const BilingualDataGrid: React.FC<BilingualDataGridProps> = ({
  records,
  selectedSentenceId,
  onSelectSentence,
  onUpdateRecord,
  filterMode,
  onFilterChange,
  currentPageNumber = 6
}) => {
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editQn, setEditQn] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const mismatchedCount = records.filter((r) => r.color === 'RED').length;
  const pagePadStr = `.${String(currentPageNumber).padStart(3, '0')}.`;
  const currentPageRecords = records.filter(
    (r) => r.pageNumber === currentPageNumber || r.img_id.includes(pagePadStr)
  );

  const redRecords = records.filter((r) => r.color === 'RED');
  const currentRedIndex = redRecords.findIndex((r) => r.sentence_id === selectedSentenceId);

  const handleNextRed = () => {
    if (redRecords.length === 0) return;
    const nextIdx = (currentRedIndex + 1) % redRecords.length;
    onSelectSentence(redRecords[nextIdx].sentence_id);
  };

  const handlePrevRed = () => {
    if (redRecords.length === 0) return;
    const prevIdx = currentRedIndex <= 0 ? redRecords.length - 1 : currentRedIndex - 1;
    onSelectSentence(redRecords[prevIdx].sentence_id);
  };

  const filteredRecords = records.filter((r) => {
    if (filterMode === 'mismatch_only' && r.color !== 'RED') {
      return false;
    }
    if (filterMode === 'current_page' && !(r.pageNumber === currentPageNumber || r.img_id.includes(pagePadStr))) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNom = r.SinoNom_Char.toLowerCase().includes(q);
      const matchQn = r.ChuQN_txt.toLowerCase().includes(q);
      const matchId = r.sentence_id.toLowerCase().includes(q);
      if (!matchNom && !matchQn && !matchId) return false;
    }
    return true;
  });

  const selectedRecord = records.find((r) => r.sentence_id === selectedSentenceId);

  const handleStartEdit = (r: AlignmentRecord) => {
    setEditingId(r.sentence_id);
    setEditNom(r.SinoNom_Char);
    setEditQn(r.ChuQN_txt);
    onSelectSentence(r.sentence_id);
  };

  const handleSaveEdit = (sentenceId: string) => {
    onUpdateRecord(sentenceId, editNom, editQn);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* 1. Grid Controls Header */}
      <div className="p-2.5 bg-gray-100 border-b border-gray-300 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="font-bold text-gray-800">
          DATA GRID: 4 COLUMNS ({filteredRecords.length} / {records.length} ROWS)
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => onFilterChange('current_page')}
            className={`px-2 py-0.5 border ${
              filterMode === 'current_page'
                ? 'bg-black text-white border-black font-bold'
                : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-200'
            }`}
          >
            [ Page {currentPageNumber} ({currentPageRecords.length}) ]
          </button>
          <button
            onClick={() => onFilterChange('all')}
            className={`px-2 py-0.5 border ${
              filterMode === 'all'
                ? 'bg-black text-white border-black font-bold'
                : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-200'
            }`}
          >
            [ All ({records.length}) ]
          </button>
          <button
            onClick={() => onFilterChange('mismatch_only')}
            className={`px-2 py-0.5 border ${
              filterMode === 'mismatch_only'
                ? 'bg-red-700 text-white border-red-800 font-bold'
                : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
            }`}
          >
            [ Red Entries Only ({mismatchedCount}) ]
          </button>
        </div>
      </div>

      {/* 2. Search & Mismatch Quick Navigator Toolbar */}
      <div className="px-2.5 py-1.5 bg-gray-50 border-b border-gray-300 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center space-x-1.5 flex-1 max-w-sm">
          <label className="text-gray-700 font-bold shrink-0">Search:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type text, Nôm char or sentence ID..."
            className="w-full px-2 py-0.5 bg-white border border-gray-400 text-xs font-mono focus:outline-none focus:border-black"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px]"
            >
              [Clear]
            </button>
          )}
        </div>

        {/* Jump through Red entries */}
        <div className="flex items-center space-x-1">
          <span className="text-gray-600 font-bold mr-1">Red Navigator:</span>
          <button
            onClick={handlePrevRed}
            disabled={redRecords.length === 0}
            className="px-2 py-0.5 bg-white border border-gray-400 hover:bg-gray-200 disabled:opacity-40"
          >
            [ &lt; Prev Red ]
          </button>
          <span className="px-1.5 py-0.5 font-bold text-red-700 bg-red-50 border border-red-200">
            {currentRedIndex >= 0 ? `${currentRedIndex + 1} / ${redRecords.length}` : `0 / ${redRecords.length}`}
          </span>
          <button
            onClick={handleNextRed}
            disabled={redRecords.length === 0}
            className="px-2 py-0.5 bg-white border border-gray-400 hover:bg-gray-200 disabled:opacity-40"
          >
            [ Next Red &gt; ]
          </button>
        </div>
      </div>

      {/* Strict 4-Column Table Grid */}
      <div className="flex-1 overflow-y-auto max-h-[550px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-200 sticky top-0 border-b border-gray-300 font-mono text-gray-900 z-10">
            <tr>
              <th className="py-2 px-2.5 border-r border-gray-300 font-bold w-36">img_id</th>
              <th className="py-2 px-2.5 border-r border-gray-300 font-bold w-40">sentence_id</th>
              <th className="py-2 px-3 border-r border-gray-300 font-bold w-52">SinoNom_Char</th>
              <th className="py-2 px-3 font-bold">ChuQN_txt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-mono">
            {filteredRecords.map((r, idx) => {
              const isSelected = r.sentence_id === selectedSentenceId;
              const isRed = r.color === 'RED';
              const isEditing = editingId === r.sentence_id;

              return (
                <tr
                  key={r.sentence_id}
                  onClick={() => !isEditing && onSelectSentence(r.sentence_id)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? 'bg-yellow-100 font-medium'
                      : isRed
                      ? 'bg-red-50/70 hover:bg-red-100/60'
                      : idx % 2 === 0
                      ? 'bg-white hover:bg-gray-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Column 1: img_id */}
                  <td className="py-2 px-2.5 border-r border-gray-200 text-gray-600 truncate max-w-[140px] text-[11px]">
                    {r.img_id}
                  </td>

                  {/* Column 2: sentence_id (<img_id without .jpg>.<index>) */}
                  <td className="py-2 px-2.5 border-r border-gray-200 text-gray-900 font-bold text-[11px]">
                    {r.sentence_id}
                  </td>

                  {/* Column 3: SinoNom_Char (Black for match, Red for mismatch) */}
                  <td
                    className="py-2 px-3 border-r border-gray-200 select-text"
                    onClick={(e) => {
                      if (isRed) {
                        e.stopPropagation();
                        handleStartEdit(r);
                      }
                    }}
                    title={isRed ? 'Click to edit red text directly' : ''}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editNom}
                        onChange={(e) => setEditNom(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(r.sentence_id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="w-full font-nom font-bold text-base px-1.5 py-0.5 border-2 border-black bg-white text-black focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`font-nom text-base font-medium tracking-wide ${
                          isRed
                            ? 'text-red-600 font-bold underline cursor-pointer'
                            : 'text-black'
                        }`}
                      >
                        {r.SinoNom_Char}
                      </span>
                    )}
                  </td>

                  {/* Column 4: ChuQN_txt (Black for match, Red for mismatch) */}
                  <td
                    className="py-2 px-3 select-text"
                    onClick={(e) => {
                      if (isRed) {
                        e.stopPropagation();
                        handleStartEdit(r);
                      }
                    }}
                    title={isRed ? 'Click to edit red text directly' : ''}
                  >
                    {isEditing ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={editQn}
                          onChange={(e) => setEditQn(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(r.sentence_id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 font-mono text-xs px-1.5 py-0.5 border-2 border-black bg-white text-black focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(r.sentence_id)}
                          className="px-2 py-0.5 bg-black text-white text-[11px] font-bold"
                        >
                          [ Save ]
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-1.5 py-0.5 bg-gray-300 text-black text-[11px]"
                        >
                          [ Cancel ]
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`font-mono text-xs ${
                          isRed
                            ? 'text-red-600 font-bold underline cursor-pointer'
                            : 'text-black'
                        }`}
                      >
                        {r.ChuQN_txt}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Selected Sentence Evaluation Inspector */}
      {selectedRecord && (
        <div className="p-2.5 bg-gray-50 border-t border-gray-300 font-mono text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-700">SELECTED:</span>
            <span className="px-2 py-0.5 bg-black text-white font-bold">{selectedRecord.sentence_id}</span>
            <span
              className={`px-2 py-0.5 font-bold border ${
                selectedRecord.color === 'RED'
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-gray-200 text-gray-800 border-gray-400'
              }`}
            >
              {selectedRecord.color === 'RED' ? 'STATUS: MISMATCHED (RED)' : 'STATUS: MATCHED (BLACK)'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-600">CHAR EVAL:</span>
            <div className="flex items-center space-x-1">
              {(selectedRecord.charStatuses || []).map((cs, i) => (
                <span
                  key={i}
                  title={`${cs.char}: ${cs.isMatched ? 'Khớp âm' : 'Khác biệt / Lệch từ điển'} (Quốc ngữ: ${cs.targetQn || ''})`}
                  className={`px-1.5 py-0.5 text-xs font-bold font-nom border ${
                    cs.isMatched
                      ? 'bg-white text-black border-gray-400'
                      : 'bg-red-100 text-red-700 border-red-500'
                  }`}
                >
                  {cs.char}
                </span>
              ))}
            </div>
            {selectedRecord.color === 'RED' && !editingId && (
              <button
                onClick={() => handleStartEdit(selectedRecord)}
                className="ml-2 px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px]"
              >
                [ Edit Row ]
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid footer */}
      <div className="p-1.5 bg-gray-100 border-t border-gray-300 text-[11px] font-mono text-gray-700 flex items-center justify-between">
        <span>Click <b className="text-red-600 underline">Red text</b> to edit inline (Enter to save)</span>
        <span><b>Black: Matched</b> | <b className="text-red-600">Red: Mismatch</b></span>
      </div>
    </div>
  );
};
