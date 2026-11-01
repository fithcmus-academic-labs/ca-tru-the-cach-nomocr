import React from 'react';
import { 
  BookOpen, 
  Upload, 
  Download, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Save 
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAlignmentStore } from '../../store/useAlignmentStore';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenHotkeys: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenExport,
  onOpenHotkeys
}) => {
  const { metadata, metrics, isBackendConnected, toggleBackendMode } = useProjectStore();
  const { hasUnsavedChanges, saveChanges } = useAlignmentStore();

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shadow-xs select-none z-20">
      {/* Brand & Project Metadata */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-900 text-white px-2.5 py-1 rounded-md">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs tracking-wider uppercase">Human-in-the-Loop Studio</span>
        </div>
        
        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-slate-800">{metadata.bookName}</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
            {metadata.studentIds.join('_')}
          </span>
        </div>
      </div>

      {/* Similarity Score & Evaluation Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-xs text-slate-500 font-medium">Similarity Metric:</span>
          <span className={`text-sm font-bold font-mono ${metrics.isSimilarityPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
            {metrics.similarityScore.toFixed(2)}%
          </span>
          {metrics.isSimilarityPassed ? (
            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>PASS (&ge;95%)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>FAIL (&lt;95%)</span>
            </span>
          )}
        </div>

        {/* Unsaved indicator */}
        {hasUnsavedChanges && (
          <button 
            onClick={() => saveChanges()}
            className="flex items-center space-x-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-md transition"
            title="Click to save changes"
          >
            <Save className="w-3.5 h-3.5 animate-pulse" />
            <span>Unsaved Changes</span>
          </button>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Backend Toggle Mode */}
          <button
            onClick={toggleBackendMode}
            className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-md border transition ${
              isBackendConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={isBackendConnected ? 'Connected to live FastAPI backend' : 'Running in local standalone mock mode'}
          >
            {isBackendConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">Live API</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Local Mock</span>
              </>
            )}
          </button>

          {/* Hotkey Helper */}
          <button
            onClick={onOpenHotkeys}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Upload PDF */}
          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-md transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>

          {/* Export Artifacts */}
          <button
            onClick={onOpenExport}
            className="flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-md shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Final Artifacts</span>
          </button>
        </div>
      </div>
    </header>
  );
};
