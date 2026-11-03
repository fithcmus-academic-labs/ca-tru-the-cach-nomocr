import { PageDocument } from '../types/document';
import { BoundingBox } from '../types/annotation';
import { AlignmentRecord } from '../types/alignment';
import { ProjectMetadata, ProjectMetrics } from '../types/project';
import allBooksDataRaw from './allBooksDataset.json';

export type BookKey = 'NOM_Y' | 'AB_431' | 'AB_160' | 'AB_456';

export interface BookDataset {
  metadata: ProjectMetadata;
  metrics: ProjectMetrics;
  pages: PageDocument[];
  records: AlignmentRecord[];
  boxesByPage: Record<number, BoundingBox[]>;
}

export interface BookOption {
  key: BookKey;
  title: string;
  pages: number;
  pdfName: string;
  rows: number;
}

export const BOOK_OPTIONS: BookOption[] = [
  {
    key: 'NOM_Y',
    title: 'Ca Trù Thể Cách, Nôm_Y',
    pages: 101,
    pdfName: 'Ca Trù Thể Cách, Nôm_Y.pdf',
    rows: 1107
  },
  {
    key: 'AB_431',
    title: 'Ca Trù Thế Cách, AB 431, Nôm_Y',
    pages: 41,
    pdfName: 'Ca Trù Thế Cách, AB 431, Nôm_Y.pdf',
    rows: 339
  },
  {
    key: 'AB_160',
    title: 'Ca Trù Thê Cách, AB 160, Nôm_Y',
    pages: 45,
    pdfName: 'Ca Trù Thê Cách, AB 160, Nôm_Y.pdf',
    rows: 369
  },
  {
    key: 'AB_456',
    title: 'Ca Trù Thế Cách, AB 456, Nôm_Y',
    pages: 45,
    pdfName: 'Ca Trù Thế Cách, AB 456, Nôm_Y.pdf',
    rows: 371
  }
];

export const ALL_BOOKS: Record<BookKey, BookDataset> = allBooksDataRaw as unknown as Record<BookKey, BookDataset>;

export function matchBookKeyFromFilename(filename: string): BookKey {
  const norm = filename.toLowerCase();
  if (norm.includes('431')) return 'AB_431';
  if (norm.includes('456')) return 'AB_456';
  if (norm.includes('160')) return 'AB_160';
  return 'NOM_Y';
}

export function getBookDataset(key: BookKey): BookDataset {
  return ALL_BOOKS[key] || ALL_BOOKS['NOM_Y'];
}

// Default export uses NOM_Y (101 pages)
const defaultBook = ALL_BOOKS['NOM_Y'];
export const REAL_METADATA: ProjectMetadata = defaultBook.metadata;
export const REAL_PAGES: PageDocument[] = defaultBook.pages;
export const REAL_ALIGNMENT_RECORDS: AlignmentRecord[] = defaultBook.records;
export const REAL_BOXES_BY_PAGE: Record<number, BoundingBox[]> = defaultBook.boxesByPage;
