import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { Formatters } from '../../utils/formatters';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { setMetadata, updateStage } = useProjectStore();
  const { loadPages } = useDocumentStore();

  const [file, setFile] = useState<File | null>(null);
  const [bookName, setBookName] = useState('Ca Trù Thê Cách, AB 160, Nôm_Y');
  const [studentIdsInput, setStudentIdsInput] = useState('PROJECT_DEV_01, PROJECT_DEV_02');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectedFile = (selected: File) => {
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF documents (.pdf) are supported.');
      return;
    }
    setError(null);
    setFile(selected);
    const inferredTitle = selected.name.replace(/\.pdf$/i, '');
    if (!bookName || bookName.includes('AB 160')) {
      setBookName(inferredTitle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF manuscript file to ingest.');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(20);

    const studentIds = studentIdsInput
      .split(/[,;\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Simulate pipeline ingestion steps
    setTimeout(() => {
      setUploadProgress(50);
      updateStage('preprocess', { status: 'running', progress: 50 });
    }, 600);

    setTimeout(() => {
      setUploadProgress(85);
      updateStage('preprocess', { status: 'completed', progress: 100 });
      updateStage('ocr', { status: 'running', progress: 70 });
    }, 1200);

    setTimeout(async () => {
      setUploadProgress(100);
      setMetadata({
        id: `proj_${Date.now()}`,
        bookName: bookName.trim(),
        studentIds,
        originalPdfName: file.name,
        originalPdfSize: file.size,
        totalPages: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await loadPages(`proj_${Date.now()}`);
      setIsProcessing(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-800">
            <UploadCloud className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-sm">Upload New Manuscript PDF</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 text-xs bg-rose-50 text-rose-700 border border-rose-200 p-2.5 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
              file
                ? 'border-emerald-400 bg-emerald-50/40'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleSelectedFile(e.target.files[0])}
            />

            {file ? (
              <div className="flex items-center justify-center space-x-3">
                <FileText className="w-8 h-8 text-emerald-600" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-xs">{file.name}</div>
                  <div className="text-[11px] text-slate-500">{Formatters.formatBytes(file.size)}</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto" />
              </div>
            ) : (
              <div className="space-y-1">
                <UploadCloud className="w-9 h-9 text-slate-400 mx-auto" />
                <div className="text-xs font-medium text-slate-700">
                  Drag and drop manuscript PDF here, or <span className="text-emerald-600 underline">browse</span>
                </div>
                <div className="text-[11px] text-slate-400">Strictly .pdf format up to 100MB</div>
              </div>
            )}
          </div>

          {/* Book Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Standardized Book Name (&lt;Tên sách&gt;)
            </label>
            <input
              type="text"
              value={bookName}
              onChange={e => setBookName(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              placeholder="e.g. Ca Trù Thê Cách, AB 160, Nôm_Y"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Must match the exact PDF file name without the .pdf extension.
            </p>
          </div>

          {/* Student IDs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student ID(s) / MSSV (comma-separated)
            </label>
            <input
              type="text"
              value={studentIdsInput}
              onChange={e => setStudentIdsInput(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              placeholder="e.g. PROJECT_DEV_01, PROJECT_DEV_02"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Used to format the final delivery archive: &lt;MSSV1_MSSV2...&gt;.zip
            </p>
          </div>

          {/* Progress bar during ingestion */}
          {isProcessing && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Ingesting PDF & Running Pipeline...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !file}
              className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-md shadow-xs transition"
            >
              {isProcessing ? 'Processing Pipeline...' : 'Start Pipeline Ingestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
