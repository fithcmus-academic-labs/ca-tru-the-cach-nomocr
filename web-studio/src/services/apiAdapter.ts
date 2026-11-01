import { ProjectMetadata, ProjectMetrics, PipelineStage } from '../types/project';
import { PageDocument } from '../types/document';
import { BoundingBox } from '../types/annotation';
import { AlignmentRecord } from '../types/alignment';
import {
  INITIAL_METADATA,
  INITIAL_PIPELINE_STAGES,
  generateMockPages,
  MOCK_ALIGNMENT_RECORDS,
  generateMockBoxesForPage,
  computeMockMetrics
} from './mockData';

export interface IBackendAdapter {
  isRealBackend: boolean;
  createProject(bookName: string, studentIds: string[], pdfFile: File): Promise<ProjectMetadata>;
  getProject(id: string): Promise<ProjectMetadata>;
  getPipelineStatus(projectId: string): Promise<PipelineStage[]>;
  getPages(projectId: string): Promise<PageDocument[]>;
  getAnnotations(projectId: string, pageNumber: number): Promise<BoundingBox[]>;
  getAlignments(projectId: string): Promise<AlignmentRecord[]>;
  updateAlignment(id: string, updates: Partial<AlignmentRecord>): Promise<AlignmentRecord>;
  updateAnnotation(id: string, updates: Partial<BoundingBox>): Promise<BoundingBox>;
  getMetrics(projectId: string): Promise<ProjectMetrics>;
}

class MockAdapter implements IBackendAdapter {
  isRealBackend = false;
  private metadata: ProjectMetadata = { ...INITIAL_METADATA };
  private pages: PageDocument[] = generateMockPages(INITIAL_METADATA.bookName);
  private records: AlignmentRecord[] = [...MOCK_ALIGNMENT_RECORDS];
  private boxesByPage: Record<number, BoundingBox[]> = {};

  constructor() {
    // Pre-populate boxes for key content pages
    [5, 6, 8, 9, 11, 26].forEach(pNum => {
      const pageRecs = this.records.filter(r => r.pageNumber === pNum);
      const imgName = `${this.metadata.bookName}.${String(pNum).padStart(3, '0')}.jpg`;
      this.boxesByPage[pNum] = generateMockBoxesForPage(pNum, imgName, pageRecs);
    });
  }

  async createProject(bookName: string, studentIds: string[], pdfFile: File): Promise<ProjectMetadata> {
    this.metadata = {
      id: `proj_${Date.now()}`,
      bookName: bookName || 'Ca Trù Thê Cách, AB 160, Nôm_Y',
      studentIds: studentIds.length > 0 ? studentIds : ['21120001', '21120002'],
      originalPdfName: pdfFile.name,
      originalPdfSize: pdfFile.size,
      totalPages: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.pages = generateMockPages(this.metadata.bookName);
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
    if (!this.boxesByPage[pageNumber]) {
      const pageRecs = this.records.filter(r => r.pageNumber === pageNumber);
      const imgName = `${this.metadata.bookName}.${String(pageNumber).padStart(3, '0')}.jpg`;
      this.boxesByPage[pageNumber] = generateMockBoxesForPage(pageNumber, imgName, pageRecs);
    }
    return this.boxesByPage[pageNumber];
  }

  async getAlignments(_projectId: string): Promise<AlignmentRecord[]> {
    return this.records;
  }

  async updateAlignment(id: string, updates: Partial<AlignmentRecord>): Promise<AlignmentRecord> {
    const idx = this.records.findIndex(r => r.id === id);
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
    return computeMockMetrics(this.records);
  }
}

class RealBackendAdapter implements IBackendAdapter {
  isRealBackend = true;
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  async createProject(bookName: string, studentIds: string[], pdfFile: File): Promise<ProjectMetadata> {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('book_name', bookName);
    formData.append('student_ids', JSON.stringify(studentIds));

    const res = await fetch(`${this.baseUrl}/projects`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to create project on backend');
    return res.json();
  }

  async getProject(id: string): Promise<ProjectMetadata> {
    const res = await fetch(`${this.baseUrl}/projects/${id}`);
    return res.json();
  }

  async getPipelineStatus(projectId: string): Promise<PipelineStage[]> {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/pipeline`);
    return res.json();
  }

  async getPages(projectId: string): Promise<PageDocument[]> {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/pages`);
    return res.json();
  }

  async getAnnotations(projectId: string, pageNumber: number): Promise<BoundingBox[]> {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/pages/${pageNumber}/annotations`);
    return res.json();
  }

  async getAlignments(projectId: string): Promise<AlignmentRecord[]> {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/alignments`);
    return res.json();
  }

  async updateAlignment(id: string, updates: Partial<AlignmentRecord>): Promise<AlignmentRecord> {
    const res = await fetch(`${this.baseUrl}/alignments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  }

  async updateAnnotation(id: string, updates: Partial<BoundingBox>): Promise<BoundingBox> {
    const res = await fetch(`${this.baseUrl}/annotations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  }

  async getMetrics(projectId: string): Promise<ProjectMetrics> {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/metrics`);
    return res.json();
  }
}

// Export active adapter (defaults to MockAdapter for instant client standalone use, can toggle)
export const apiAdapter: IBackendAdapter = new MockAdapter();
export const realBackendAdapter: IBackendAdapter = new RealBackendAdapter();
