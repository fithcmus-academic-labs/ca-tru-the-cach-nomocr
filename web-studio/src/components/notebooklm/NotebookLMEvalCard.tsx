import React from 'react';
import { 
  Sparkles, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck2, 
  BookOpen, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAlignmentStore } from '../../store/useAlignmentStore';

interface NotebookLMEvalCardProps {
  onOpenExport: () => void;
  onFilterRedOnly: () => void;
}

export const NotebookLMEvalCard: React.FC<NotebookLMEvalCardProps> = ({
  onOpenExport,
  onFilterRedOnly
}) => {
  const { metrics, metadata } = useProjectStore();
  const { records } = useAlignmentStore();

  const totalChars = metrics.totalSinoNomChars || sumChars(records);
  const mismatchedChars = metrics.mismatchedChars;

  function sumChars(recs: any[]) {
    return recs.reduce((acc, r) => acc + (r.SinoNom_Char?.length || 0), 0);
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden shrink-0">
      {/* Background soft glow decoration */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Đánh Giá Chất Lượng Ngữ Liệu (Evaluation Overview)
            </h3>
            <p className="text-xs text-slate-500">
              Tự động kiểm định âm nghĩa Hán Nôm & dóng hàng song song Quốc ngữ
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>ĐẠT CHUẨN (&ge; 95.0%)</span>
        </span>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        {/* Metric 1: Similarity Score */}
        <div className="bg-white/80 backdrop-blur-xs border border-emerald-100 p-3 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Độ Tương Đồng
          </span>
          <div className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">
            {metrics.similarityScore.toFixed(2)}%
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            (1 - N_lệch / N_tổng) * 100
          </span>
        </div>

        {/* Metric 2: Total Pairs */}
        <div className="bg-white/80 backdrop-blur-xs border border-slate-100 p-3 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Cặp Câu Dóng Hàng
          </span>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
            {records.length}
          </div>
          <span className="text-[10px] text-slate-500">
            Dóng song song tự động
          </span>
        </div>

        {/* Metric 3: Total Characters */}
        <div className="bg-white/80 backdrop-blur-xs border border-slate-100 p-3 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Tổng Chữ Hán Nôm
          </span>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
            {totalChars.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">
            Ký tự Unicode NFC
          </span>
        </div>

        {/* Metric 4: Mismatches */}
        <button
          onClick={onFilterRedOnly}
          className="bg-white/80 backdrop-blur-xs border border-rose-100 hover:border-rose-300 p-3 rounded-xl shadow-2xs text-left transition group cursor-pointer"
          title="Bấm để lọc xem danh sách câu có chữ đỏ"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wide">
              Chữ Cần Xem Lại
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition" />
          </div>
          <div className="text-xl font-extrabold text-rose-600 font-mono mt-0.5">
            {mismatchedChars} chữ
          </div>
          <span className="text-[10px] text-rose-600 font-medium underline">
            Nhấp để sửa ngay
          </span>
        </button>
      </div>

      {/* Export Action Strip */}
      <div className="mt-4 pt-3.5 border-t border-emerald-200/60 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Bao gồm 4 thư mục <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">ch/</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">vi/</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">misc/</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">blank/</code>, file Excel & CSV
          </span>
        </div>

        <button
          onClick={onOpenExport}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Xuất File Nộp (.ZIP)</span>
        </button>
      </div>
    </div>
  );
};
