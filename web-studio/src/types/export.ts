export interface ValidationError {
  type: 'bbox_points_count' | 'out_of_bounds' | 'empty_transcription' | 'sentence_id_mismatch' | 'missing_label';
  severity: 'error' | 'warning';
  message: string;
  pageId?: string;
  img_id?: string;
  sentence_id?: string;
  recordId?: string;
}

export interface ValidationReport {
  isValid: boolean; // Can export only if zero critical errors
  totalErrors: number;
  totalWarnings: number;
  errors: ValidationError[];
  summary: {
    totalPages: number;
    totalBoxesCh: number;
    totalBoxesVi: number;
    totalSentences: number;
    similarityPercentage: number;
    isSimilarityPassed: boolean; // >= 95%
  };
}

export interface ExportOptions {
  zipName: string; // <MSSV1_MSSV2...>.zip
  bookName: string; // <Tên sách>
  includePdf: boolean;
  includeUpdatedPdf: boolean;
  includeExcel: boolean;
  includeCsv: boolean;
  includePPOCRLabel: boolean;
}
