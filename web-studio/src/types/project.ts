export type PipelineStageId = 
  | 'preprocess' 
  | 'ocr' 
  | 'align' 
  | 'clean' 
  | 'evaluate' 
  | 'export_prep';

export type PipelineStageStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface PipelineStage {
  id: PipelineStageId;
  name: string;
  description: string;
  status: PipelineStageStatus;
  progress: number; // 0 - 100
  startTime?: string;
  endTime?: string;
  errorMessage?: string;
}

export interface ProjectMetadata {
  id: string;
  bookName: string;
  studentIds: string[]; // e.g. ["21120001", "21120002"]
  originalPdfName: string;
  originalPdfSize: number;
  totalPages: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMetrics {
  totalPages: number;
  processedPages: number;
  totalAlignedPairs: number;
  totalSinoNomChars: number;
  totalVietnameseWords: number;
  validatedPairs: number;
  mismatchedChars: number;
  pendingReviews: number;
  similarityScore: number; // Percentage: (1 - mismatchedChars / totalSinoNomChars) * 100
  isSimilarityPassed: boolean; // >= 95.0%
}
