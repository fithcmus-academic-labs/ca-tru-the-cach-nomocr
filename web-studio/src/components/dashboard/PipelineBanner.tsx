import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Cpu
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { PipelineStageId } from '../../types/project';

export const PipelineBanner: React.FC = () => {
  const { stages, updateStage } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRetryStage = (stageId: PipelineStageId) => {
    updateStage(stageId, { status: 'running', progress: 30 });
    setTimeout(() => {
      updateStage(stageId, { status: 'running', progress: 75 });
    }, 700);
    setTimeout(() => {
      updateStage(stageId, { status: 'completed', progress: 100 });
    }, 1500);
  };

  const completedCount = stages.filter(s => s.status === 'completed').length;
  const overallProgress = Math.round((completedCount / stages.length) * 100);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 select-none">
      <div className="flex items-center justify-between">
        {/* Stages chips */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <div className="flex items-center space-x-1.5 mr-2 text-xs font-semibold text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>NLP Pipeline ({overallProgress}%):</span>
          </div>

          {stages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isRunning = stage.status === 'running';
            const isFailed = stage.status === 'failed';

            return (
              <div
                key={stage.id}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs border transition ${
                  isCompleted
                    ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-300'
                    : isRunning
                    ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 animate-pulse'
                    : isFailed
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {isRunning && <Clock className="w-3 h-3 text-emerald-400 animate-spin" />}
                {isFailed && <AlertCircle className="w-3 h-3 text-rose-400" />}

                <span className="font-medium">
                  {idx + 1}. {stage.name.split('.')[1] || stage.name}
                </span>

                {isFailed && (
                  <button
                    onClick={() => handleRetryStage(stage.id)}
                    className="p-0.5 hover:text-white rounded"
                    title="Retry this stage"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Toggle details button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 ml-4 py-1"
        >
          <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded Stage Log Panel */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-6 gap-2 text-xs">
          {stages.map(stage => (
            <div key={stage.id} className="bg-slate-800/60 p-2 rounded border border-slate-700">
              <div className="font-semibold text-slate-200 truncate">{stage.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{stage.description}</div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Status: {stage.status}</span>
                <span>{stage.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
