import { describe, it, expect } from 'vitest';
import {
  BOOK_OPTIONS,
  ALL_BOOKS,
  matchBookKeyFromFilename,
  getBookDataset
} from '../services/realDataset';

describe('Multi-Book Dataset Verification', () => {
  it('should have all 4 books configured with exact page counts', () => {
    expect(BOOK_OPTIONS).toHaveLength(4);

    const nomY = BOOK_OPTIONS.find((b) => b.key === 'NOM_Y');
    const ab431 = BOOK_OPTIONS.find((b) => b.key === 'AB_431');
    const ab160 = BOOK_OPTIONS.find((b) => b.key === 'AB_160');
    const ab456 = BOOK_OPTIONS.find((b) => b.key === 'AB_456');

    expect(nomY?.pages).toBe(101);
    expect(nomY?.rows).toBe(1107);

    expect(ab431?.pages).toBe(41);
    expect(ab431?.rows).toBe(339);

    expect(ab160?.pages).toBe(45);
    expect(ab160?.rows).toBe(369);

    expect(ab456?.pages).toBe(45);
    expect(ab456?.rows).toBe(371);
  });

  it('should accurately match book keys from various PDF filenames', () => {
    expect(matchBookKeyFromFilename('Ca Trù Thể Cách, Nôm_Y.pdf')).toBe('NOM_Y');
    expect(matchBookKeyFromFilename('Ca Trù Thế Cách, AB 431, Nôm_Y.pdf')).toBe('AB_431');
    expect(matchBookKeyFromFilename('Ca Trù Thê Cách, AB 160, Nôm_Y.pdf')).toBe('AB_160');
    expect(matchBookKeyFromFilename('Ca Trù Thế Cách, AB 456, Nôm_Y.pdf')).toBe('AB_456');
  });

  it('every book dataset should enforce strictly 4 points per bounding box and valid sentence IDs', () => {
    for (const key of ['NOM_Y', 'AB_431', 'AB_160', 'AB_456'] as const) {
      const ds = getBookDataset(key);
      expect(ds).toBeDefined();
      expect(ds.pages.length).toBe(
        key === 'NOM_Y' ? 101 : key === 'AB_431' ? 41 : 45
      );

      // Verify all bounding boxes have strictly 4 coordinate points
      for (const pNum in ds.boxesByPage) {
        const boxes = ds.boxesByPage[pNum];
        for (const box of boxes) {
          expect(box.points).toHaveLength(4);
          for (const pt of box.points) {
            expect(pt).toHaveLength(2);
            expect(typeof pt[0]).toBe('number');
            expect(typeof pt[1]).toBe('number');
          }
        }
      }

      // Verify sentence ID prefix
      for (const r of ds.records) {
        const prefix = r.img_id.replace(/\.jpg$/i, '');
        expect(r.sentence_id.startsWith(prefix)).toBe(true);
      }

      // Verify similarity score >= 95%
      expect(ds.metrics.similarityScore).toBeGreaterThanOrEqual(95.0);
    }
  });
});
