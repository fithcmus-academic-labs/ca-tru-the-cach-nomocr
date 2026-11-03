import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Save, 
  CornerDownRight 
} from 'lucide-react';
import { useAlignmentStore } from '../../store/useAlignmentStore';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { PhoneticService } from '../../services/phoneticService';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({ isOpen, onClose }) => {
  const { getSelectedRecord, updateRecordText, updateRecordReviewStatus } = useAlignmentStore();
  const { boxes, updateBoxPoints } = useAnnotationStore();

  const record = getSelectedRecord();

  const [nomInput, setNomInput] = useState('');
  const [qnInput, setQnInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    if (record) {
      setNomInput(record.SinoNom_Char);
      setQnInput(record.ChuQN_txt);
      setNoteInput(record.editorNote || '');
      setIsApproved(record.reviewStatus === 'approved');
    }
  }, [record]);

  if (!isOpen || !record) return null;

  // Real-time evaluation preview
  const previewEval = PhoneticService.evaluatePair(nomInput, qnInput);

  const handleSave = () => {
    updateRecordText(record.sentence_id, nomInput, qnInput, noteInput);
    if (isApproved) {
      updateRecordReviewStatus(record.sentence_id, 'approved');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-semibold text-sm text-slate-800">
              Human-in-the-Loop Sentence Inspector
            </h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              sentence_id: {record.sentence_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Sino-Nom Text Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sino-Nom Line (SinoNom_Char)
            </label>
            <input
              type="text"
              value={nomInput}
              onChange={e => setNomInput(e.target.value)}
              className="w-full font-nom text-lg px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quoc Ngu Text Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quốc ngữ Line (ChuQN_txt)
            </label>
            <input
              type="text"
              value={qnInput}
              onChange={e => setQnInput(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Character-by-character dictionary breakdown */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Phonetic Alignment Analysis (Character-Level):</span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {previewEval.charStatuses.map((cs, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border text-center ${
                    cs.isMatched
                      ? 'bg-white border-slate-200'
                      : 'bg-rose-50 border-rose-300 text-rose-700'
                  }`}
                >
                  <div className="font-nom text-xl font-bold">{cs.char}</div>
                  <div className="text-[11px] font-medium text-slate-600 truncate mt-1">
                    {cs.targetQn || '-'}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {cs.readings?.slice(0, 2).join(', ') || 'N/A'}
                  </div>
                  <span
                    className={`inline-block mt-1 text-[8px] font-bold px-1 py-0.2 rounded uppercase ${
                      cs.isMatched
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-rose-200 text-rose-800'
                    }`}
                  >
                    {cs.color}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-600 pt-1 flex items-center justify-between">
              <span>
                Matching status:{' '}
                <strong className={previewEval.isMatched ? 'text-emerald-700' : 'text-rose-700'}>
                  {previewEval.isMatched ? '100% Phonetically Matched' : `${previewEval.mismatchedCount} character(s) require review`}
                </strong>
              </span>
              <span className="font-mono text-slate-500">
                Formula: {previewEval.matchedCount} Black / {previewEval.mismatchedCount} Red
              </span>
            </div>
          </div>

          {/* Editorial Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Editorial Audit Note (Lý do hiệu đính / ghi chú âm đọc)
            </label>
            <textarea
              rows={2}
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              placeholder="e.g. Chữ mượn âm cổ, chữ dị thể chính tả..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Approval Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="approve-check"
              checked={isApproved}
              onChange={e => setIsApproved(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="approve-check" className="text-xs font-medium text-slate-700 cursor-pointer">
              Mark this sentence pair as <span className="text-emerald-700 font-bold">Approved / Reviewed</span> by expert
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-xs transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Apply Updates</span>
          </button>
        </div>
      </div>
    </div>
  );
};
