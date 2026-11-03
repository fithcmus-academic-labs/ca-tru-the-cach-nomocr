import React, { useState } from 'react';
import { 
  Table, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Edit2, 
  Check, 
  X, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useAlignmentStore } from '../../store/useAlignmentStore';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { AlignmentRecord } from '../../types/alignment';

interface SimpleAlignmentGridProps {
  onOpenEditModal: () => void;
}

export const SimpleAlignmentGrid: React.FC<SimpleAlignmentGridProps> = ({ onOpenEditModal }) => {
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

    // Sync page if different
    if (r.pageNumber !== currentPageNumber) {
      setCurrentPageNumber(r.pageNumber);
    }

    // Sync select corresponding BBox on canvas
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
    <div className="flex-1 flex flex-col h-full bg-white select-none overflow-hidden border-l border-slate-200">
      {/* 1. Top Controls Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex flex-col space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Table className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-800">
              Bảng Ngữ Liệu Song Song Hán Nôm – Quốc Ngữ
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">
              ({records.length} câu)
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm chữ Nôm hoặc Quốc ngữ..."
              className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
              }`}
            >
              Tất cả ({records.length})
            </button>

            <button
              onClick={() => setFilterStatus('mismatch_only')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'mismatch_only'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cần kiểm tra (chữ đỏ: {mismatchedCount})</span>
            </button>

            <button
              onClick={() => setFilterStatus('reviewed')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'reviewed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã khớp ({approvedCount})</span>
            </button>
          </div>

          {/* Quick Guide Indicator */}
          <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              <span>Đen: Khớp nghĩa</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span className="text-rose-600 font-bold">Đỏ: Cần chỉnh</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Strict 4-Column Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/90 sticky top-0 border-b border-slate-200 text-slate-700 font-bold z-10">
            <tr>
              <th className="py-2.5 px-3 w-40 border-r border-slate-200 font-mono">img_id</th>
              <th className="py-2.5 px-3 w-44 border-r border-slate-200 font-mono">sentence_id</th>
              <th className="py-2.5 px-4 w-64 border-r border-slate-200">SinoNom_Char</th>
              <th className="py-2.5 px-4">ChuQN_txt</th>
              <th className="py-2.5 px-3 w-20 text-center">Thao tác</th>
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
                      ? 'bg-amber-50/90 ring-1 ring-amber-400 z-1'
                      : isRed
                      ? 'bg-rose-50/50 hover:bg-rose-50'
                      : idx % 2 === 0
                      ? 'bg-white hover:bg-slate-50'
                      : 'bg-slate-50/30 hover:bg-slate-50'
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
                        className="w-full text-base font-nom font-bold px-2 py-1 bg-white border border-emerald-500 rounded focus:outline-none ring-1 ring-emerald-500 text-slate-900"
                        autoFocus
                      />
                    ) : (
                      <div 
                        onDoubleClick={() => startInlineEdit(r)}
                        className="flex items-center space-x-2"
                        title="Nhấp đúp để sửa nhanh"
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
                          <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold shrink-0">
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
                          className="flex-1 text-sm font-medium px-2 py-1 bg-white border border-emerald-500 rounded focus:outline-none ring-1 ring-emerald-500 text-slate-900"
                        />
                        <button
                          onClick={() => saveInlineEdit(r.sentence_id)}
                          className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition"
                          title="Lưu (Enter)"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelInlineEdit}
                          className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition"
                          title="Huỷ (Esc)"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDoubleClick={() => startInlineEdit(r)}
                        className="text-sm font-medium text-slate-800"
                        title="Nhấp đúp để sửa nhanh"
                      >
                        {r.ChuQN_txt}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
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
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition"
                            title="Sửa nhanh dòng này"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRecordReviewStatus(
                                r.sentence_id,
                                r.reviewStatus === 'approved' ? 'pending' : 'approved'
                              );
                            }}
                            className={`p-1.5 rounded-md transition ${
                              r.reviewStatus === 'approved'
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-slate-300 hover:text-emerald-600 hover:bg-slate-100'
                            }`}
                            title={r.reviewStatus === 'approved' ? 'Đã duyệt' : 'Duyệt câu này'}
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

      {/* 3. Bottom Summary Info */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium">
          Hiển thị <b className="text-slate-800">{filteredRecords.length}</b> / {records.length} câu
        </span>

        <span className="text-[11px] font-mono text-slate-400">
          Nhấp đúp vào ô để sửa trực tiếp • Bấm Enter để lưu và tự động chấm điểm lại
        </span>
      </div>
    </div>
  );
};
