import React, { useState } from 'react';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Check, 
  X, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAlignmentStore } from '../../store/useAlignmentStore';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { AlignmentRecord } from '../../types/alignment';

export const NotebookLMCenterStudio: React.FC = () => {
  const { 
    records, 
    selectedSentenceId, 
    setSelectedSentenceId, 
    filterStatus, 
    setFilterStatus, 
    searchQuery, 
    setSearchQuery,
    updateRecordText,
    updateRecordReviewStatus 
  } = useAlignmentStore();

  const { boxes, setSelectedBoxId } = useAnnotationStore();
  const { setCurrentPageNumber, currentPageNumber } = useDocumentStore();

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editQn, setEditQn] = useState('');

  const mismatchedCount = records.filter(r => r.color === 'RED').length;
  const approvedCount = records.filter(r => r.color !== 'RED').length;

  // Filter records
  const filteredRecords = records.filter(r => {
    if (filterStatus === 'mismatch_only' && r.color !== 'RED') return false;
    if (filterStatus === 'reviewed' && r.color === 'RED') return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchNom = r.SinoNom_Char.toLowerCase().includes(q);
      const matchQn = r.ChuQN_txt.toLowerCase().includes(q);
      const matchId = r.sentence_id.toLowerCase().includes(q);
      if (!matchNom && !matchQn && !matchId) return false;
    }
    return true;
  });

  const handleSelectRow = (r: AlignmentRecord) => {
    setSelectedSentenceId(r.sentence_id);

    // Sync page
    if (r.pageNumber !== currentPageNumber) {
      setCurrentPageNumber(r.pageNumber);
    }

    // Sync select corresponding BBox on scan
    const matchingBox = boxes.find(b => b.sentence_id === r.sentence_id && b.region_type === 'ch');
    if (matchingBox) {
      setSelectedBoxId(matchingBox.id);
    }
  };

  const startInlineEdit = (r: AlignmentRecord) => {
    setEditingId(r.sentence_id);
    setEditNom(r.SinoNom_Char);
    setEditQn(r.ChuQN_txt);
  };

  const saveInlineEdit = (sentenceId: string) => {
    updateRecordText(sentenceId, editNom, editQn);
    setEditingId(null);
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden select-none">
      {/* 1. Header with Filters & Search (NotebookLM Style) */}
      <div className="p-4 border-b border-slate-200/70 flex flex-col space-y-3 shrink-0 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Ngữ Liệu Song Song (Parallel Notes)
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-full">
              {filteredRecords.length} / {records.length} câu
            </span>
          </div>

          {/* Search Input */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm chữ Nôm hoặc Quốc ngữ..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Tất cả câu ({records.length})
            </button>

            <button
              onClick={() => setFilterStatus('mismatch_only')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                filterStatus === 'mismatch_only'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cần xem lại ({mismatchedCount} câu đỏ)</span>
            </button>

            <button
              onClick={() => setFilterStatus('reviewed')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                filterStatus === 'reviewed'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã khớp ({approvedCount})</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              <span>Chữ đen: Chuẩn</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span className="text-rose-600 font-bold">Chữ đỏ: Cần sửa</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Strict 4-Column Table Grid */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#f8fafd] sticky top-0 border-b border-slate-200 text-slate-600 font-bold z-10">
            <tr>
              <th className="py-2.5 px-3 w-40 border-r border-slate-200/70 font-mono text-[11px]">img_id</th>
              <th className="py-2.5 px-3 w-44 border-r border-slate-200/70 font-mono text-[11px]">sentence_id</th>
              <th className="py-2.5 px-4 w-64 border-r border-slate-200/70 font-bold">Chữ Hán Nôm (SinoNom_Char)</th>
              <th className="py-2.5 px-4 font-bold">Chữ Quốc Ngữ (ChuQN_txt)</th>
              <th className="py-2.5 px-3 w-20 text-center">Sửa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((r, idx) => {
              const isSelected = r.sentence_id === selectedSentenceId;
              const isRed = r.color === 'RED';
              const isEditing = editingId === r.sentence_id;

              return (
                <tr
                  key={r.sentence_id}
                  onClick={() => !isEditing && handleSelectRow(r)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-50/80 ring-1 ring-emerald-400 z-1'
                      : isRed
                      ? 'bg-rose-50/40 hover:bg-rose-50/70'
                      : idx % 2 === 0
                      ? 'bg-white hover:bg-slate-50'
                      : 'bg-[#fafbfc] hover:bg-slate-50'
                  }`}
                >
                  {/* Cột 1: img_id */}
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-100 truncate max-w-xs">
                    {r.img_id}
                  </td>

                  {/* Cột 2: sentence_id */}
                  <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-700 border-r border-slate-100">
                    <span className="text-slate-900">{r.sentence_id}</span>
                  </td>

                  {/* Cột 3: SinoNom_Char */}
                  <td className="py-2 px-4 border-r border-slate-100">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editNom}
                        onChange={(e) => setEditNom(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveInlineEdit(r.sentence_id);
                          if (e.key === 'Escape') cancelInlineEdit();
                        }}
                        className="w-full text-base font-nom font-bold px-2 py-1 bg-white border border-emerald-500 rounded-lg focus:outline-none ring-2 ring-emerald-500/20 text-slate-900"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onDoubleClick={() => startInlineEdit(r)}
                        className="flex items-center space-x-2"
                        title="Nhấp đúp chuột để sửa nhanh"
                      >
                        <span
                          className={`font-nom text-lg tracking-wide ${
                            isRed
                              ? 'text-rose-600 font-bold underline decoration-rose-300'
                              : 'text-slate-900 font-medium'
                          }`}
                        >
                          {r.SinoNom_Char}
                        </span>

                        {isRed && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full font-bold shrink-0">
                            Chữ đỏ
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Cột 4: ChuQN_txt */}
                  <td className="py-2 px-4 text-slate-800">
                    {isEditing ? (
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="text"
                          value={editQn}
                          onChange={(e) => setEditQn(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveInlineEdit(r.sentence_id);
                            if (e.key === 'Escape') cancelInlineEdit();
                          }}
                          className="flex-1 text-sm font-medium px-2 py-1 bg-white border border-emerald-500 rounded-lg focus:outline-none ring-2 ring-emerald-500/20 text-slate-900"
                        />
                        <button
                          onClick={() => saveInlineEdit(r.sentence_id)}
                          className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                          title="Lưu (Enter)"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelInlineEdit}
                          className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                          title="Huỷ (Esc)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDoubleClick={() => startInlineEdit(r)}
                        className="text-sm font-medium text-slate-800"
                        title="Nhấp đúp chuột để sửa nhanh"
                      >
                        {r.ChuQN_txt}
                      </div>
                    )}
                  </td>

                  {/* Cột 5: Actions */}
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {isEditing ? null : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRow(r);
                              startInlineEdit(r);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                            title="Sửa nhanh câu này"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRecordReviewStatus(
                                r.sentence_id,
                                r.reviewStatus === 'approved' ? 'pending' : 'approved'
                              );
                            }}
                            className={`p-1.5 rounded-lg transition ${
                              r.reviewStatus === 'approved'
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-slate-300 hover:text-emerald-600 hover:bg-slate-100'
                            }`}
                            title={r.reviewStatus === 'approved' ? 'Đã duyệt' : 'Duyệt câu'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Footer note */}
      <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Nhấp đúp vào ô để sửa trực tiếp • Bấm Enter để lưu và tự động cập nhật điểm tương đồng
        </span>
        <span className="font-mono text-slate-400">
          Chỉ tiêu chất lượng: &ge; 95%
        </span>
      </div>
    </div>
  );
};
