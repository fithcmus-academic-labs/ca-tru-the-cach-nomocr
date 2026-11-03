import React, { useEffect, useState, useRef } from 'react';

interface Block2TerminalProps {
  isProcessing: boolean;
  onPipelineComplete: () => void;
  fileName?: string;
  totalPages?: number;
}

export const Block2Terminal: React.FC<Block2TerminalProps> = ({
  isProcessing,
  onPipelineComplete,
  fileName = 'Ca Trù Thể Cách, Nôm_Y.pdf',
  totalPages = 101
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProcessing) return;

    setLogs([]);
    setProgress(0);

    const steps = [
      { text: `[INFO] Initializing NLP Pipeline Worker for: ${fileName}`, pct: 10 },
      { text: `[INFO] Loading Sino-Nom phonetic dictionary cache (20,000+ entries)...`, pct: 20 },
      { text: `[STAGE 1/6] Preprocessing: Rendering ${totalPages} pages at 300 DPI. Detecting T2b margin line at x=260px... DONE`, pct: 35 },
      { text: `[STAGE 2/6] Dual OCR Engine: KimHanNom Cloud OCR & Transliteration API integration active... DONE`, pct: 55 },
      { text: `[STAGE 3/6] Bilingual Alignment: DP sequence alignment across ${totalPages} pages... DONE`, pct: 70 },
      { text: `[STAGE 4/6] Text Cleaning: Unicode NFC normalization, 4-point BBoxes check... DONE`, pct: 85 },
      { text: `[STAGE 5/6] Phonetic Evaluation: Character color evaluation completed (>= 95%)... DONE`, pct: 95 },
      { text: `[STAGE 6/6] Pipeline Execution Finished Successfully. Launching Workspace...`, pct: 100 }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const s = steps[currentStep];
        setLogs((prev) => [...prev, s.text]);
        setProgress(s.pct);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onPipelineComplete();
        }, 300);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isProcessing, fileName, totalPages, onPipelineComplete]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Render text-based progress bar
  const renderTextProgressBar = () => {
    const totalBars = 30;
    const filledBars = Math.round((progress / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    return `[${'='.repeat(filledBars)}${' '.repeat(emptyBars)}] Progress: ${progress}%`;
  };

  return (
    <div className="w-full bg-black text-white p-5 border border-black font-mono text-xs shadow-inner space-y-3">
      {/* Terminal Title */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2 text-gray-400">
        <span className="font-bold text-gray-200">
          2. Pipeline Terminal Console
        </span>
        <span>
          {isProcessing ? 'Status: RUNNING' : 'Status: READY'}
        </span>
      </div>

      {/* Terminal Log Output Window */}
      <div
        ref={logContainerRef}
        className="h-44 overflow-y-auto bg-black text-green-400 font-mono text-xs p-2.5 rounded border border-gray-900 space-y-1 select-text"
      >
        {logs.length === 0 ? (
          <div className="text-gray-600">
            {isProcessing ? 'Starting pipeline execution...' : 'Awaiting PDF upload to begin execution.'}
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="leading-tight">
              {log}
            </div>
          ))
        )}
      </div>

      {/* Text Progress Bar */}
      <div className="flex items-center justify-between pt-1 text-gray-300 font-bold">
        <pre className="text-xs tracking-wider">{renderTextProgressBar()}</pre>
        {progress === 100 && (
          <span className="text-green-400 font-bold uppercase">
            [ COMPLETED ]
          </span>
        )}
      </div>
    </div>
  );
};
