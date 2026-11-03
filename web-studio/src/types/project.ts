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
  studentIds: string[]; // e.g. ["PROJECT_DEV_01", "PROJECT_DEV_02"]
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

export interface BookClassificationResult {
  book_type: string; // T1, T1w, T2, T2w, T2b, Tnom, Tnomw, Tqn, Tref, Tx
  type_name: string;
  description: string;
  confidence: number;
  layout_details: {
    total_pages?: number;
    avg_aspect_ratio?: number;
    is_dual_page_scan?: boolean;
    has_red_margin_line?: boolean;
    has_grid_notebook?: boolean;
    is_handwritten?: boolean;
    detected_signals?: string[];
  };
  recommended_pipeline: {
    pipeline_id: string;
    name: string;
    strategy: string;
    ocr_engines?: Record<string, string>;
    alignment_mode?: string;
    deliverable_folders?: string[];
    steps: string[];
  };
}
