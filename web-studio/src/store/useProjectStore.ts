import { create } from 'zustand';
import { ProjectMetadata, ProjectMetrics, PipelineStage } from '../types/project';
import { apiAdapter } from '../services/apiAdapter';
import { INITIAL_METADATA, INITIAL_PIPELINE_STAGES, computeMockMetrics, MOCK_ALIGNMENT_RECORDS } from '../services/mockData';

interface ProjectState {
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
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  metadata: INITIAL_METADATA,
  stages: INITIAL_PIPELINE_STAGES,
  metrics: computeMockMetrics(MOCK_ALIGNMENT_RECORDS),
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
  }
}));
