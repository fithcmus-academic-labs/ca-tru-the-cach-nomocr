import { create } from 'zustand';
import { AlignmentRecord, AlignmentReviewStatus } from '../types/alignment';
import { apiAdapter } from '../services/apiAdapter';
import { PhoneticService } from '../services/phoneticService';
import { REAL_ALIGNMENT_RECORDS } from '../services/realDataset';

interface AlignmentState {
  records: AlignmentRecord[];
  selectedSentenceId: string | null;
  filterStatus: 'all' | 'mismatch_only' | 'reviewed';
  searchQuery: string;
  hasUnsavedChanges: boolean;

  setRecords: (records: AlignmentRecord[]) => void;
  setSelectedSentenceId: (sentenceId: string | null) => void;
  setFilterStatus: (filter: 'all' | 'mismatch_only' | 'reviewed') => void;
  setSearchQuery: (query: string) => void;
  
  updateRecordText: (
    sentenceId: string,
    newNom: string,
    newQn: string,
    note?: string
  ) => void;

  updateRecordReviewStatus: (
    sentenceId: string,
    status: AlignmentReviewStatus
  ) => void;

  selectNextMismatch: () => void;
  selectPreviousMismatch: () => void;
  getSelectedRecord: () => AlignmentRecord | undefined;
  loadAlignments: (projectId: string) => Promise<void>;
  saveChanges: () => Promise<void>;
}

export const useAlignmentStore = create<AlignmentState>((set, get) => ({
  records: [...REAL_ALIGNMENT_RECORDS],
  selectedSentenceId: REAL_ALIGNMENT_RECORDS[0]?.sentence_id || null,
  filterStatus: 'all',
  searchQuery: '',
  hasUnsavedChanges: false,

  setRecords: (records) => set({ records }),
  setSelectedSentenceId: (sentenceId) => set({ selectedSentenceId: sentenceId }),
  setFilterStatus: (filter) => set({ filterStatus: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  updateRecordText: (sentenceId, newNom, newQn, note) =>
    set((state) => {
      const records = state.records.map((r) => {
        if (r.sentence_id !== sentenceId) return r;

        // Re-evaluate phonetic match
        const evalRes = PhoneticService.evaluatePair(newNom, newQn);

        return {
          ...r,
          SinoNom_Char: newNom,
          ChuQN_txt: newQn,
          isMatched: evalRes.isMatched,
          color: evalRes.color,
          charStatuses: evalRes.charStatuses,
          reviewStatus: 'reviewed' as const,
          editorNote: note ?? r.editorNote,
          isEdited: true
        };
      });

      return { records, hasUnsavedChanges: true };
    }),

  updateRecordReviewStatus: (sentenceId, status) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.sentence_id === sentenceId ? { ...r, reviewStatus: status, isEdited: true } : r
      ),
      hasUnsavedChanges: true
    })),

  selectNextMismatch: () => {
    const { records, selectedSentenceId } = get();
    const mismatches = records.filter((r) => r.color === 'RED');
    if (mismatches.length === 0) return;

    const currIdx = mismatches.findIndex((r) => r.sentence_id === selectedSentenceId);
    const nextIdx = (currIdx + 1) % mismatches.length;
    set({ selectedSentenceId: mismatches[nextIdx].sentence_id });
  },

  selectPreviousMismatch: () => {
    const { records, selectedSentenceId } = get();
    const mismatches = records.filter((r) => r.color === 'RED');
    if (mismatches.length === 0) return;

    const currIdx = mismatches.findIndex((r) => r.sentence_id === selectedSentenceId);
    const prevIdx = currIdx <= 0 ? mismatches.length - 1 : currIdx - 1;
    set({ selectedSentenceId: mismatches[prevIdx].sentence_id });
  },

  getSelectedRecord: () => {
    const { records, selectedSentenceId } = get();
    return records.find((r) => r.sentence_id === selectedSentenceId);
  },

  loadAlignments: async (projectId) => {
    try {
      const recs = await apiAdapter.getAlignments(projectId);
      set({ records: recs });
    } catch (e) {
      console.warn('Using mock alignments', e);
    }
  },

  saveChanges: async () => {
    set({ hasUnsavedChanges: false });
  }
}));
