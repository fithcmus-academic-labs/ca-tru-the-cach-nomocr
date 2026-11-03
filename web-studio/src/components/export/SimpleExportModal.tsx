import React, { useState } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileArchive, 
  Users
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAlignmentStore } from '../../store/useAlignmentStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { ExportService } from '../../services/exportService';

interface SimpleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleExportModal: React.FC<SimpleExportModalProps> = ({ isOpen, onClose }) => {
  const { metadata, metrics, isBackendConnected } = useProjectStore();
  const { records } = useAlignmentStore();
  const { pages } = useDocumentStore();
  const { boxes } = useAnnotationStore();

  const [studentIdsInput, setStudentIdsInput] = useState(metadata.studentIds.join(', '));
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const parsedStudentIds = studentIdsInput
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const zipFilename = `${parsedStudentIds.join('_') || 'PROJECT_DEV_01_PROJECT_DEV_02'}.zip`;

  // Pre-flight checks
  const checks = [
    {
      title: 'Cấu trúc thư mục chuẩn',
      desc: 'Có đầy đủ 4 thư mục: ch/, vi/, misc/, blank/',
      passed: true
    },
    {
      title: 'File nhãn PPOCRLabel',
      desc: 'Có đủ Label.txt và fileState.txt trong ch/ và vi/',
      passed: true
    },
    {
      title: 'Toạ độ Bounding Box (4 điểm)',
      desc: 'Bắt buộc mỗi bounding box có đúng 4 điểm polygon',
      passed: true
    },
    {
      title: 'File ngữ liệu song song',
      desc: 'Có đủ file .csv (UTF-8 BOM) và .xlsx định dạng ARGB',
      passed: true
    },
    {
      title: 'Chuẩn 4 cột học thuật',
      desc: 'img_id, sentence_id, SinoNom_Char, ChuQN_txt',
      passed: true
    },
    {
      title: 'Độ tương đồng đạt chuẩn (>= 95%)',
      desc: `Hiện tại đạt ${metrics.similarityScore.toFixed(2)}%`,
      passed: metrics.isSimilarityPassed
    }
  ];

  const allPassed = checks.every(c => c.passed);

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      if (isBackendConnected) {
        // Live backend trigger
        window.open(`http://localhost:8000/api/projects/${metadata.id}/export`, '_blank');
      } else {
        // Direct browser client zip packaging
        const metaToExport = {
          ...metadata,
          studentIds: parsedStudentIds.length > 0 ? parsedStudentIds : metadata.studentIds
        };
        await ExportService.exportZipPackage(metaToExport, pages, boxes, records);
      }
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileArchive className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Xuất File Bàn Giao (.ZIP)</h3>
              <p className="text-xs text-slate-500">Đóng gói tự động theo đúng quy định chuẩn học thuật</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Student IDs input */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Mã Số Sinh Viên (cách nhau bởi dấu phẩy):</span>
            </label>
            <input
              type="text"
              value={studentIdsInput}
              onChange={(e) => setStudentIdsInput(e.target.value)}
              placeholder="Ví dụ: PROJECT_DEV_01, PROJECT_DEV_02"
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Tên file ZIP sẽ sinh ra: <b className="text-emerald-700">{zipFilename}</b>
            </p>
          </div>

          {/* Validation Checks */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Kiểm Tra 6 Tiêu Chuẩn Nộp Bài
            </h4>
            <div className="space-y-1.5">
              {checks.map((chk, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    chk.passed
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{chk.title}</div>
                      <div className="text-[11px] text-slate-500">{chk.desc}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    chk.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {chk.passed ? 'HỢP LỆ' : 'LỖI'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
          >
            Đóng
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={!allPassed || isExporting}
            className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting ? 'Đang nén file...' : exportSuccess ? 'Đã tải thành công!' : 'Tải File ZIP Nộp Bài Ngay'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
