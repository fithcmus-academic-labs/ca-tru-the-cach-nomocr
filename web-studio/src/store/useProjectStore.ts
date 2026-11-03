import { create } from 'zustand';
import { ProjectMetadata, ProjectMetrics, PipelineStage } from '../types/project';
import { apiAdapter } from '../services/apiAdapter';
import { INITIAL_PIPELINE_STAGES } from '../services/mockData';
import {
  BookKey,
  getBookDataset,
  ALL_BOOKS
} from '../services/realDataset';
import { useDocumentStore } from './useDocumentStore';
import { useAlignmentStore } from './useAlignmentStore';
import { useAnnotationStore } from './useAnnotationStore';

interface ProjectState {
  activeBookKey: BookKey;
  metadata: ProjectMetadata;
  stages: PipelineStage[];
  metrics: ProjectMetrics;
  isUploading: boolean;
  isBackendConnected: boolean;
  setMetadata: (meta: ProjectMetadata) => void;
  updateStage: (stageId: string, updates: Partial<PipelineStage>) => void;
  updateMetrics: (metrics: ProjectMetrics) => void;
  setIsUploading: (uploading: boolean) => void;
  toggleBackendMode: () => void;
  loadProject: () => Promise<void>;
  switchBook: (key: BookKey) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const initialBook = ALL_BOOKS['NOM_Y'];

  return {
    activeBookKey: 'NOM_Y',
    metadata: initialBook.metadata,
    stages: INITIAL_PIPELINE_STAGES,
    metrics: initialBook.metrics,
    isUploading: false,
    isBackendConnected: false,

    setMetadata: (meta) => set({ metadata: meta }),

    updateStage: (stageId, updates) =>
      set((state) => ({
        stages: state.stages.map((s) => (s.id === stageId ? { ...s, ...updates } : s))
      })),

    updateMetrics: (metrics) => set({ metrics }),

    setIsUploading: (uploading) => set({ isUploading: uploading }),

    toggleBackendMode: () => set((state) => ({ isBackendConnected: !state.isBackendConnected })),

    loadProject: async () => {
      try {
        const meta = await apiAdapter.getProject(get().metadata.id);
        const metrics = await apiAdapter.getMetrics(meta.id);
        const stages = await apiAdapter.getPipelineStatus(meta.id);
        set({ metadata: meta, metrics, stages });
      } catch (e) {
        console.warn('Backend load failed, using local store data', e);
      }
    },

    switchBook: (key: BookKey) => {
      const bookData = getBookDataset(key);
      if (apiAdapter.switchBook) {
        apiAdapter.switchBook(key);
      }

      set({
        activeBookKey: key,
        metadata: bookData.metadata,
        metrics: bookData.metrics
      });

      // Synchronize document store with all real pages (101, 41, 45, 45)
      const docStore = useDocumentStore.getState();
      docStore.setPages(bookData.pages);
      const firstContentPage = bookData.pages.find((p) => p.category === 'content')?.pageNumber || 1;
      docStore.setCurrentPageNumber(firstContentPage);

      // Synchronize alignment store with all real CSV records
      const alignStore = useAlignmentStore.getState();
      alignStore.setRecords(bookData.records);
      alignStore.setSelectedSentenceId(bookData.records[0]?.sentence_id || null);

      // Synchronize annotation store with bounding boxes for the initial page
      const annotStore = useAnnotationStore.getState();
      annotStore.setBoxes(bookData.boxesByPage[firstContentPage] || []);
    }
  };
});
