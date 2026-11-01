import React from 'react';
import { X, CheckCircle2, Clock, AlertCircle, RotateCcw, Cpu } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { PipelineStageId } from '../../types/project';

interface PipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PipelineModal: React.FC<PipelineModalProps> = ({ isOpen, onClose }) => {
  const { stages, updateStage } = useProjectStore();

  if (!isOpen) return null;

  const handleRetryStage = (stageId: PipelineStageId) => {
    updateStage(stageId, { status: 'running', progress: 40 });
    setTimeout(() => {
      updateStage(stageId, { status: 'completed', progress: 100 });
    }, 1200);
  };

  const completedCount = stages.filter(s => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / stages.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Cpu className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tiến trình Xử lý NLP (6 Công đoạn)</h3>
              <p className="text-xs text-slate-500">Tự động hoá trích xuất, OCR, dóng hàng và đánh giá ngữ liệu song song</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="px-5 py-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Toàn bộ 6 giai đoạn đã hoàn thành chuẩn xác ({completedCount}/6)</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700">{progressPercent}%</span>
        </div>

        {/* Stages List */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isRunning = stage.status === 'running';
            const isFailed = stage.status === 'failed';

            return (
              <div
                key={stage.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition flex items-start justify-between space-x-3"
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 shrink-0">
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {isRunning && <Clock className="w-4 h-4 text-emerald-600 animate-spin" />}
                    {isFailed && <AlertCircle className="w-4 h-4 text-rose-600" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">
                        {idx + 1}. {stage.name.replace(/^\d+\.\s*/, '')}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                        {stage.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{stage.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    {stage.progress}%
                  </span>
                  <button
                    onClick={() => handleRetryStage(stage.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                    title="Chạy lại công đoạn này"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
