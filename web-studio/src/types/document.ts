export type PageCategory = 'content' | 'misc' | 'blank' | 'intro' | 'ref' | 'toc';
export type PageReviewStatus = 'unreviewed' | 'in_progress' | 'approved' | 'has_issues';

export interface PageDocument {
  pageNumber: number; // 1-indexed
  pageId: string;     // e.g. "003", "006"
  imgName: string;    // e.g. "Ca Trù Thê Cách, AB 160, Nôm_Y.006.jpg"
  imageUrl: string;   // Image display URL (data URL or backend HTTP URL)
  thumbnailUrl?: string;
  category: PageCategory;
  reviewStatus: PageReviewStatus;
  width: number;
  height: number;
  detectedChRegions: number;
  detectedViRegions: number;
  mismatchedCount: number;
}
