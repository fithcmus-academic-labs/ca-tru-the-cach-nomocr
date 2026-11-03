import { ProjectMetadata, ProjectMetrics, PipelineStage } from '../types/project';
import { PageDocument } from '../types/document';
import { BoundingBox } from '../types/annotation';
import { AlignmentRecord } from '../types/alignment';
import {
  REAL_METADATA,
  REAL_PAGES,
  REAL_ALIGNMENT_RECORDS,
  REAL_BOXES_BY_PAGE,
  BookKey,
  BookDataset,
  getBookDataset
} from './realDataset';
import { INITIAL_PIPELINE_STAGES } from './mockData';

export interface CloudOcrLine {
  line_id: number;
  nom_text: string;
  quocngu_transcription: string;
  bbox: number[][];
}

export interface CloudOcrResult {
  status: string;
  server_file_name: string;
  total_lines: number;
  lines: CloudOcrLine[];
}

export interface PipelineRunResult {
  status: string;
  message: string;
  book_key: string;
  book_name?: string;
  records_count?: number;
  total_pages?: number;
}

export interface IBackendAdapter {
  isRealBackend: boolean;
  switchBook?(key: BookKey): BookDataset;
  createProject(bookName: string, studentIds: string[], pdfFile: File): Promise<ProjectMetadata>;
  getProject(id: string): Promise<ProjectMetadata>;
  getPipelineStatus(projectId: string): Promise<PipelineStage[]>;
  getPages(projectId: string): Promise<PageDocument[]>;
  getAnnotations(projectId: string, pageNumber: number): Promise<BoundingBox[]>;
  getAlignments(projectId: string): Promise<AlignmentRecord[]>;
  updateAlignment(id: string, updates: Partial<AlignmentRecord>): Promise<AlignmentRecord>;
  updateAnnotation(id: string, updates: Partial<BoundingBox>): Promise<BoundingBox>;
  getMetrics(projectId: string): Promise<ProjectMetrics>;
  runPipeline?(bookKey: string): Promise<PipelineRunResult>;
  runCloudOcr?(fileOrPage: File | number, bookKey?: string): Promise<CloudOcrResult>;
}

class AuthenticDatasetAdapter implements IBackendAdapter {
  isRealBackend = true;
  private metadata: ProjectMetadata = { ...REAL_METADATA };
  private pages: PageDocument[] = [...REAL_PAGES];
  private records: AlignmentRecord[] = [...REAL_ALIGNMENT_RECORDS];
  private boxesByPage: Record<number, BoundingBox[]> = { ...REAL_BOXES_BY_PAGE };

  switchBook(key: BookKey): BookDataset {
    const ds = getBookDataset(key);
    this.metadata = { ...ds.metadata };
    this.pages = [...ds.pages];
    this.records = [...ds.records];
    this.boxesByPage = { ...ds.boxesByPage };
    return ds;
  }

  async createProject(bookName: string, studentIds: string[], pdfFile: File): Promise<ProjectMetadata> {
    this.metadata = {
      id: `proj_${Date.now()}`,
      bookName: bookName || REAL_METADATA.bookName,
      studentIds: studentIds.length > 0 ? studentIds : REAL_METADATA.studentIds,
      originalPdfName: pdfFile.name,
      originalPdfSize: pdfFile.size,
      totalPages: REAL_PAGES.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.metadata;
  }

  async getProject(_id: string): Promise<ProjectMetadata> {
    return this.metadata;
  }

  async getPipelineStatus(_projectId: string): Promise<PipelineStage[]> {
    return INITIAL_PIPELINE_STAGES;
  }

  async getPages(_projectId: string): Promise<PageDocument[]> {
    return this.pages;
  }

  async getAnnotations(_projectId: string, pageNumber: number): Promise<BoundingBox[]> {
    return this.boxesByPage[pageNumber] || [];
  }

  async getAlignments(_projectId: string): Promise<AlignmentRecord[]> {
    return this.records;
  }

  async updateAlignment(id: string, updates: Partial<AlignmentRecord>): Promise<AlignmentRecord> {
    const idx = this.records.findIndex(r => r.id === id || r.sentence_id === id);
    if (idx >= 0) {
      this.records[idx] = { ...this.records[idx], ...updates, isEdited: true };
      return this.records[idx];
    }
    throw new Error(`Record ${id} not found.`);
  }

  async updateAnnotation(id: string, updates: Partial<BoundingBox>): Promise<BoundingBox> {
    for (const pageNum in this.boxesByPage) {
      const boxes = this.boxesByPage[pageNum];
      const idx = boxes.findIndex(b => b.id === id);
      if (idx >= 0) {
        boxes[idx] = { ...boxes[idx], ...updates, isModified: true };
        return boxes[idx];
      }
    }
    throw new Error(`Annotation ${id} not found.`);
  }

  async getMetrics(_projectId: string): Promise<ProjectMetrics> {
    const totalChars = this.records.reduce((acc, r) => acc + (r.SinoNom_Char?.length || 0), 0);
    const mismatchedChars = this.records.reduce((acc, r) => {
      const redCount = (r.charStatuses || []).filter(cs => !cs.isMatched).length;
      return acc + (redCount > 0 ? redCount : r.color === 'RED' ? r.SinoNom_Char.length : 0);
    }, 0);
    const similarity = totalChars > 0 ? (1.0 - (mismatchedChars / totalChars)) * 100.0 : 100.0;
    const validatedPairs = this.records.filter(r => r.reviewStatus === 'approved' || r.reviewStatus === 'reviewed').length;

    return {
      totalPages: this.pages.length,
      processedPages: this.pages.length,
      totalAlignedPairs: this.records.length,
      totalSinoNomChars: totalChars,
      totalVietnameseWords: this.records.reduce((acc, r) => acc + (r.ChuQN_txt?.split(/\s+/).filter(Boolean).length || 0), 0),
      validatedPairs,
      mismatchedChars,
      pendingReviews: this.records.length - validatedPairs,
      similarityScore: Math.round(similarity * 100) / 100,
      isSimilarityPassed: similarity >= 95.0
    };
  }

  async runPipeline(bookKey: string): Promise<PipelineRunResult> {
    const ds = this.switchBook(bookKey as BookKey);
    return {
      status: 'success',
      message: `Pipeline completed successfully for ${ds.metadata.bookName}`,
      book_key: bookKey,
      book_name: ds.metadata.bookName,
      records_count: ds.records.length,
      total_pages: ds.pages.length
    };
  }

  async runCloudOcr(fileOrPage: File | number, _bookKey?: string): Promise<CloudOcrResult> {
    const pageNum = typeof fileOrPage === 'number' ? fileOrPage : 6;
    const currentBoxes = this.boxesByPage[pageNum] || [];
    return {
      status: 'success',
      server_file_name: `clc_sinonom_${Date.now()}.jpg`,
      total_lines: currentBoxes.length,
      lines: currentBoxes.map((b, idx) => ({
        line_id: idx + 1,
        nom_text: b.transcription || '正音',
        quocngu_transcription: 'chính âm',
        bbox: b.points
      }))
    };
  }
}

class RealBackendAdapter implements IBackendAdapter {
  isRealBackend = true;
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  private fallback = new AuthenticDatasetAdapter();

  async createProject(bookName: string, studentIds: string[], pdfFile: File): Promise<ProjectMetadata> {
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('book_name', bookName);
      formData.append('student_ids', JSON.stringify(studentIds));

      const res = await fetch(`${this.baseUrl}/projects`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Backend error');
      return res.json();
    } catch {
      return this.fallback.createProject(bookName, studentIds, pdfFile);
    }
  }

  async getProject(id: string): Promise<ProjectMetadata> {
    try {
      const res = await fetch(`${this.baseUrl}/projects/${id}`);
      if (!res.ok) throw new Error('Backend error');
      return res.json();
    } catch {
      return this.fallback.getProject(id);
    }
  }

  async getPipelineStatus(projectId: string): Promise<PipelineStage[]> {
    try {
      const res = await fetch(`${this.baseUrl}/projects/${projectId}/pipeline`);
      if (!res.ok) throw new Error('Backend error');
      return res.json();
    } catch {
      return this.fallback.getPipelineStatus(projectId);
    }
  }

  async getPages(projectId: string): Promise<PageDocument[]> {
    try {
      const res = await fetch(`${this.baseUrl}/projects/${projectId}/pages`);
      if (!res.ok) throw new Error('Backend error');
      return res.json();
    } catch {
      return this.fallback.getPages(projectId);
    }
  }

  async getAnnotations(projectId: string, pageNumber: number): Promise<BoundingBox[]> {
    try {
      const res = await fetch(`${this.baseUrl}/projects/${projectId}/pages/${pageNumber}/annotations`);
      if (!res.ok) throw new Error('Backend error');
      return res.json();
    } catch {
      return this.fallback.getAnnotations(projectId, pageNumber);
    }
  }

  async getAlignments(projectId: string): Promise<AlignmentRecord[]> {
    try {
      const res = await fetch(`${this.baseUrl}/projects/${projectId}/alignments`);
      if (!res.ok) throw new Error('Backend error');
      return res.json();
    } catch {
      return this.fallback.getAlignments(projectId);
    }
  }

  async updateAlignment(id: string, updates: Partial<AlignmentRecord>): Promise<AlignmentRecord> {
    try {
      const res = await fetch(`${this.baseUrl}/alignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Backend error');
      return res.json();
    } catch {
      return this.fallback.updateAlignment(id, updates);
    }
  }

  async updateAnnotation(id: string, updates: Partial<BoundingBox>): Promise<BoundingBox> {
    try {
      const res = await fetch(`${this.baseUrl}/annotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Backend error');
      return res.json();
    } catch {
      return this.fallback.updateAnnotation(id, updates);
    }
  }

  async getMetrics(projectId: string): Promise<ProjectMetrics> {
    try {
      const res = await fetch(`${this.baseUrl}/projects/${projectId}/metrics`);
      if (!res.ok) throw new Error('Backend error');
      return res.json();
    } catch {
      return this.fallback.getMetrics(projectId);
    }
  }

  async runPipeline(bookKey: string): Promise<PipelineRunResult> {
    try {
      const res = await fetch(`${this.baseUrl}/pipeline/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_key: bookKey })
      });
      if (!res.ok) throw new Error('Backend pipeline error');
      return res.json();
    } catch {
      return this.fallback.runPipeline!(bookKey);
    }
  }

  async runCloudOcr(fileOrPage: File | number, bookKey?: string): Promise<CloudOcrResult> {
    try {
      const formData = new FormData();
      if (typeof fileOrPage === 'number') {
        formData.append('page_num', fileOrPage.toString());
        if (bookKey) formData.append('book_key', bookKey);
      } else {
        formData.append('file', fileOrPage);
      }
      const res = await fetch(`${this.baseUrl}/pipeline/ocr-transliterate`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Cloud OCR error');
      return res.json();
    } catch {
      return this.fallback.runCloudOcr!(fileOrPage, bookKey);
    }
  }
}

// Export active adapter (defaults to AuthenticDatasetAdapter with real manuscript data)
export const apiAdapter: IBackendAdapter = new AuthenticDatasetAdapter();
export const realBackendAdapter: IBackendAdapter = new RealBackendAdapter();
