import { describe, it, expect } from 'vitest';
import { ExportService } from '../services/exportService';
import { BoundingBox } from '../types/annotation';
import { PageDocument } from '../types/document';
import { AlignmentRecord } from '../types/alignment';

describe('ExportService', () => {
  const dummyPage: PageDocument = {
    pageNumber: 5,
    pageId: '005',
    imgName: 'Ca Trù Thê Cách, AB 160, Nôm_Y.005.jpg',
    imageUrl: '',
    category: 'content',
    reviewStatus: 'approved',
    width: 1400,
    height: 1800,
    detectedChRegions: 1,
    detectedViRegions: 1,
    mismatchedCount: 0
  };

  const dummyBox: BoundingBox = {
    id: 'box_ch_5_0',
    img_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.005.jpg',
    sentence_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.005.1',
    region_type: 'ch',
    transcription: '歌嚋㓜格',
    points: [[100, 100], [400, 100], [400, 150], [100, 150]],
    status: 'matched'
  };

  it('generates valid PPOCRLabel Label.txt with 4 points polygon format', () => {
    const labelTxt = ExportService.generateLabelTxt('ch', [dummyPage], [dummyBox]);
    expect(labelTxt).toContain('ch/Ca Trù Thê Cách, AB 160, Nôm_Y.005.jpg\t');
    
    const parts = labelTxt.split('\t');
    expect(parts.length).toBe(2);
    const parsed = JSON.parse(parts[1]);
    expect(parsed.length).toBe(1);
    expect(parsed[0].transcription).toBe('歌嚋㓜格');
    expect(parsed[0].points.length).toBe(4);
  });

  it('generates valid fileState.txt with status 1', () => {
    const stateTxt = ExportService.generateFileStateTxt('ch', [dummyPage]);
    expect(stateTxt).toBe('ch/Ca Trù Thê Cách, AB 160, Nôm_Y.005.jpg\t1');
  });

  it('generates CSV with UTF-8 BOM and exact 4 columns', () => {
    const dummyRecord: AlignmentRecord = {
      id: 'rec_1',
      img_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.005.jpg',
      sentence_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.005.1',
      SinoNom_Char: '歌嚋㓜格',
      ChuQN_txt: 'Ca trù thê cách',
      pageNumber: 5,
      lineIndex: 0,
      isMatched: true,
      color: 'BLACK',
      charStatuses: [],
      reviewStatus: 'approved'
    };

    const csv = ExportService.generateCsv([dummyRecord]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('img_id,sentence_id,SinoNom_Char,ChuQN_txt');
    expect(csv).toContain('"Ca Trù Thê Cách, AB 160, Nôm_Y.005.jpg","Ca Trù Thê Cách, AB 160, Nôm_Y.005.1","歌嚋㓜格","Ca trù thê cách"');
  });
});
