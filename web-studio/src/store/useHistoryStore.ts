import { create } from 'zustand';

export interface HistoryAction {
  type: 'edit_text' | 'move_vertex' | 'status_change';
  description: string;
  undo: () => void;
  redo: () => void;
}

interface HistoryState {
  past: HistoryAction[];
  future: HistoryAction[];
  pushAction: (action: HistoryAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  pushAction: (action) =>
    set((state) => ({
      past: [...state.past.slice(-30), action], // keep last 30 actions
      future: [],
      canUndo: true,
      canRedo: false
    })),

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    previous.undo();

    set({
      past: newPast,
      future: [previous, ...future],
      canUndo: newPast.length > 0,
      canRedo: true
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    next.redo();

    set({
      past: [...past, next],
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0
    });
  }
}));
