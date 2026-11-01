import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface HotkeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeyModal: React.FC<HotkeyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotkeys = [
    { key: '↑ / ↓', desc: 'Navigate previous / next alignment row' },
    { key: 'N', desc: 'Jump to next mismatched (Red) sentence' },
    { key: 'P', desc: 'Jump to previous mismatched (Red) sentence' },
    { key: 'Enter', desc: 'Open inline inspector / edit selected sentence' },
    { key: 'R', desc: 'Toggle Reviewed / Approved status for active pair' },
    { key: 'Ctrl + S', desc: 'Save pending edits and sync state' },
    { key: 'Ctrl + Z', desc: 'Undo last edit or vertex move' },
    { key: 'Ctrl + Shift + Z', desc: 'Redo previously undone action' },
    { key: 'Space + Drag', desc: 'Pan scan image across canvas' },
    { key: '+ / -', desc: 'Zoom in / zoom out scan canvas' },
    { key: '0', desc: 'Reset zoom to fit screen' },
    { key: 'Esc', desc: 'Cancel current edit or deselect box' },
    { key: '?', desc: 'Toggle this hotkey reference modal' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-800">
            <Keyboard className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-sm">Productivity Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
          {hotkeys.map((h, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{h.desc}</span>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-semibold text-slate-800 shadow-2xs">
                {h.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-1.5 rounded-md transition"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
