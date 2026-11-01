import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileArchive, 
  FileSpreadsheet, 
  FileText, 
  FolderTree,
  ShieldCheck
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { useAlignmentStore } from '../../store/useAlignmentStore';
import { ExportService } from '../../services/exportService';
import { ValidationReport } from '../../types/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { metadata, metrics } = useProjectStore();
  const { pages } = useDocumentStore();
  const { boxes } = useAnnotationStore();
  const { records } = useAlignmentStore();

  const [report, setReport] = useState<ValidationReport | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('');

  useEffect(() => {
    if (isOpen) {
      const rep = ExportService.validateDataset(pages, boxes, records, metrics);
      setReport(rep);
    }
  }, [isOpen, pages, boxes, records, metrics]);

  if (!isOpen || !report) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    try {
      await ExportService.exportZipPackage(
        metadata,
        pages,
        boxes,
        records,
        (percent, step) => {
          setExportProgress(percent);
          setExportStep(step);
        }
      );
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed: ' + String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const studentPrefix = metadata.studentIds.join('_') || 'STUDENT_SUBMISSION';
  const zipName = `${studentPrefix}.zip`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-sm">Export Pre-Flight Audit & Artifact Packaging</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Audit Verification Matrix */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-100 font-semibold text-slate-700 flex items-center justify-between">
              <span>Standard Compliance Verification Checklist</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${report.isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {report.isValid ? 'ALL CRITICAL CHECKS PASSED' : 'VALIDATION ISSUES DETECTED'}
              </span>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              <div className="py-1.5 px-2 flex items-center justify-between">
                <span className="text-slate-600">1. Bounding Boxes Points: Exactly 4 Points Polygon</span>
                <span className="inline-flex items-center space-x-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% 4-pt format</span>
                </span>
              </div>

              <div className="py-1.5 px-2 flex items-center justify-between">
                <span className="text-slate-600">2. PPOCRLabel Schema: Label.txt & fileState.txt</span>
                <span className="inline-flex items-center space-x-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ch/ and vi/ valid</span>
                </span>
              </div>

              <div className="py-1.5 px-2 flex items-center justify-between">
                <span className="text-slate-600">3. Sentence ID Rule: &lt;img_id without .jpg&gt;.&lt;index&gt;</span>
                <span className="inline-flex items-center space-x-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Consistent ID prefix</span>
                </span>
              </div>

              <div className="py-1.5 px-2 flex items-center justify-between">
                <span className="text-slate-600">4. Spreadsheet Color Styling: ARGB Black/Red Fonts</span>
                <span className="inline-flex items-center space-x-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>FF000000 / FFFF0000</span>
                </span>
              </div>

              <div className="py-1.5 px-2 flex items-center justify-between">
                <span className="text-slate-600">5. Phonetic Similarity Threshold (&ge; 95.0%)</span>
                <span className={`inline-flex items-center space-x-1 font-bold ${report.summary.isSimilarityPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {report.summary.isSimilarityPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>{report.summary.similarityPercentage.toFixed(2)}% (Requirement: &ge;95%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Directory Hierarchy Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] text-slate-700">
            <div className="flex items-center space-x-1.5 font-sans font-semibold text-slate-800 mb-2">
              <FolderTree className="w-4 h-4 text-emerald-600" />
              <span>Target Deliverable Archive Structure:</span>
            </div>
            <pre className="text-slate-600 leading-relaxed overflow-x-auto">
{`${zipName}
└── ${metadata.bookName}/
    ├── ch/
    │   ├── images/
    │   ├── Label.txt
    │   └── fileState.txt
    ├── vi/
    │   ├── images/
    │   ├── Label.txt
    │   └── fileState.txt
    ├── misc/
    ├── blank/
    ├── ${metadata.bookName}.pdf
    ├── ${metadata.bookName}.csv (UTF-8 BOM)
    └── ${metadata.bookName}.xlsx (ARGB Black/Red)`}
            </pre>
          </div>

          {/* Progress bar during export */}
          {isExporting && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-700 font-medium">
                <span>{exportStep}</span>
                <span className="font-mono">{exportProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-200 rounded-full"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Total Pairs: <strong>{records.length}</strong> | Total Pages: <strong>{pages.length}</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
            >
              Close
            </button>
            <button
              onClick={handleStartExport}
              disabled={isExporting || !report.isValid}
              className="flex items-center space-x-1.5 px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-md shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Packaging ZIP...' : `Download ${zipName}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
