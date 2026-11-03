import { PageDocument } from '../types/document';
import { BoundingBox } from '../types/annotation';
import { AlignmentRecord } from '../types/alignment';
import { ProjectMetadata, ProjectMetrics, PipelineStage } from '../types/project';
import { Formatters } from '../utils/formatters';

export const INITIAL_METADATA: ProjectMetadata = {
  id: 'proj_ab160_midterm',
  bookName: 'Ca Trù Thê Cách, AB 160, Nôm_Y',
  studentIds: ['PROJECT_DEV_01', 'PROJECT_DEV_02'],
  originalPdfName: 'Ca Trù Thê Cách, AB 160, Nôm_Y.pdf',
  originalPdfSize: 9989975,
  totalPages: 45,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'preprocess',
    name: '1. Document Preprocessing',
    description: 'Render high-resolution 300 DPI pages, classify into content/misc/blank, and parse T2b margin.',
    status: 'completed',
    progress: 100,
    startTime: '10:00:00',
    endTime: '10:00:15'
  },
  {
    id: 'ocr',
    name: '2. Dual OCR Recognition',
    description: 'Multi-model inference for Sino-Nom logographs and cursive handwritten Quốc ngữ lines.',
    status: 'completed',
    progress: 100,
    startTime: '10:00:15',
    endTime: '10:00:35'
  },
  {
    id: 'align',
    name: '3. Bilingual Sentence Alignment',
    description: 'Phonetic Dynamic Programming aligning Sino-Nom and Quốc ngữ pairs across page boundaries.',
    status: 'completed',
    progress: 100,
    startTime: '10:00:35',
    endTime: '10:00:45'
  },
  {
    id: 'clean',
    name: '4. Text Cleaning & PPOCRLabel Prep',
    description: 'Unicode NFC normalization, archaic punctuation mapping, and 4-point polygon bounding box generation.',
    status: 'completed',
    progress: 100,
    startTime: '10:00:45',
    endTime: '10:00:52'
  },
  {
    id: 'evaluate',
    name: '5. Quality Evaluation & Color Coding',
    description: 'Dictionary lookup, computing dataset similarity metric (>= 95.0%) and assigning Black/Red fonts.',
    status: 'completed',
    progress: 100,
    startTime: '10:00:52',
    endTime: '10:00:58'
  },
  {
    id: 'export_prep',
    name: '6. Export Deliverables Preparation',
    description: 'Verify PPOCRLabel Label.txt/fileState.txt, CSV with BOM, and ARGB colored Excel spreadsheets.',
    status: 'completed',
    progress: 100,
    startTime: '10:00:58',
    endTime: '10:01:02'
  }
];

// SVG Data URL generator for realistic manuscript page background
export function createManuscriptSvgUrl(pageNumber: number, title: string): string {
  const isMisc = pageNumber === 1 || pageNumber === 2 || pageNumber === 45;
  const bgFill = isMisc ? '#f5efe0' : '#fcfaf2';
  const gridLines = [];
  
  if (!isMisc) {
    // Red vertical margin at x ~ 260
    gridLines.push(`<line x1="260" y1="0" x2="260" y2="1800" stroke="#e11d48" stroke-width="3" stroke-opacity="0.8" />`);
    // Student notebook blue horizontal guidelines
    for (let y = 100; y < 1750; y += 45) {
      gridLines.push(`<line x1="60" y1="${y}" x2="1350" stroke="#93c5fd" stroke-width="1" stroke-opacity="0.4" />`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1800" viewBox="0 0 1400 1800">
    <rect width="1400" height="1800" fill="${bgFill}"/>
    ${gridLines.join('\n')}
    <rect x="20" y="20" width="1360" height="1760" fill="none" stroke="#d6d3d1" stroke-width="2"/>
    <text x="700" y="50" font-family="serif" font-size="20" fill="#78716c" text-anchor="middle">
      ${title} — Trang ${pageNumber} / 45
    </text>
    <text x="130" y="100" font-family="sans-serif" font-size="14" fill="#a8a29e">
      [Lề ghi chú: x &lt; 260px]
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Generate full 45 pages according to audit ledger
export function generateMockPages(bookName: string): PageDocument[] {
  const pages: PageDocument[] = [];
  for (let i = 1; i <= 45; i++) {
    const pageId = String(i).padStart(3, '0');
    const isMisc = i === 1 || i === 2 || i === 45;
    const category = isMisc ? 'misc' : 'content';
    const imgName = `${bookName}.${pageId}.jpg`;
    
    pages.push({
      pageNumber: i,
      pageId,
      imgName,
      imageUrl: createManuscriptSvgUrl(i, bookName),
      category,
      reviewStatus: isMisc ? 'approved' : i === 6 ? 'has_issues' : 'approved',
      width: 1400,
      height: 1800,
      detectedChRegions: isMisc ? 0 : 9,
      detectedViRegions: isMisc ? 0 : 9,
      mismatchedCount: i === 8 || i === 9 || i === 11 || i === 12 || i === 26 || i === 27 ? 1 : 0
    });
  }
  return pages;
}

// Authentic real manuscript lines for AB_160
export const MOCK_ALIGNMENT_RECORDS: AlignmentRecord[] = [
  // Page 5
  {
    id: 'rec_5_1',
    pageNumber: 5,
    lineIndex: 0,
    img_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.005.jpg',
    sentence_id: Formatters.buildSentenceId('Ca Trù Thê Cách, AB 160, Nôm_Y.005.jpg', 1),
    SinoNom_Char: '歌嚋㓜格',
    ChuQN_txt: 'Ca trù thê cách',
    isMatched: true,
    color: 'BLACK',
    reviewStatus: 'approved',
    charStatuses: [
      { char: '歌', isMatched: true, color: 'BLACK', targetQn: 'Ca' },
      { char: '嚋', isMatched: true, color: 'BLACK', targetQn: 'trù' },
      { char: '㓜', isMatched: true, color: 'BLACK', targetQn: 'thê' },
      { char: '格', isMatched: true, color: 'BLACK', targetQn: 'cách' }
    ]
  },
  {
    id: 'rec_5_2',
    pageNumber: 5,
    lineIndex: 1,
    img_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.005.jpg',
    sentence_id: Formatters.buildSentenceId('Ca Trù Thê Cách, AB 160, Nôm_Y.005.jpg', 2),
    SinoNom_Char: '一千里色秋中月',
    ChuQN_txt: 'Một nghìn dặm sắc thu trong nguyệt',
    isMatched: true,
    color: 'BLACK',
    reviewStatus: 'approved',
    charStatuses: [
      { char: '一', isMatched: true, color: 'BLACK', targetQn: 'Một' },
      { char: '千', isMatched: true, color: 'BLACK', targetQn: 'nghìn' },
      { char: '里', isMatched: true, color: 'BLACK', targetQn: 'dặm' },
      { char: '色', isMatched: true, color: 'BLACK', targetQn: 'sắc' },
      { char: '秋', isMatched: true, color: 'BLACK', targetQn: 'thu' },
      { char: '中', isMatched: true, color: 'BLACK', targetQn: 'trong' },
      { char: '月', isMatched: true, color: 'BLACK', targetQn: 'nguyệt' }
    ]
  },

  // Page 6
  {
    id: 'rec_6_1',
    pageNumber: 6,
    lineIndex: 0,
    img_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.006.jpg',
    sentence_id: Formatters.buildSentenceId('Ca Trù Thê Cách, AB 160, Nôm_Y.006.jpg', 1),
    SinoNom_Char: '風送秋聲江上來',
    ChuQN_txt: 'Gió đưa tiếng thu trên sông lại',
    isMatched: true,
    color: 'BLACK',
    reviewStatus: 'approved',
    charStatuses: [
      { char: '風', isMatched: true, color: 'BLACK', targetQn: 'Gió' },
      { char: '送', isMatched: true, color: 'BLACK', targetQn: 'đưa' },
      { char: '秋', isMatched: true, color: 'BLACK', targetQn: 'tiếng' },
      { char: '聲', isMatched: true, color: 'BLACK', targetQn: 'thu' },
      { char: '江', isMatched: true, color: 'BLACK', targetQn: 'trên' },
      { char: '上', isMatched: true, color: 'BLACK', targetQn: 'sông' },
      { char: '來', isMatched: true, color: 'BLACK', targetQn: 'lại' }
    ]
  },
  {
    id: 'rec_6_2',
    pageNumber: 6,
    lineIndex: 1,
    img_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.006.jpg',
    sentence_id: Formatters.buildSentenceId('Ca Trù Thê Cách, AB 160, Nôm_Y.006.jpg', 2),
    SinoNom_Char: '萬里長江天一色',
    ChuQN_txt: 'Muôn dặm trường giang trời một sắc',
    isMatched: true,
    color: 'BLACK',
    reviewStatus: 'approved',
    charStatuses: [
      { char: '萬', isMatched: true, color: 'BLACK', targetQn: 'Muôn' },
      { char: '里', isMatched: true, color: 'BLACK', targetQn: 'dặm' },
      { char: '長', isMatched: true, color: 'BLACK', targetQn: 'trường' },
      { char: '江', isMatched: true, color: 'BLACK', targetQn: 'giang' },
      { char: '天', isMatched: true, color: 'BLACK', targetQn: 'trời' },
      { char: '一', isMatched: true, color: 'BLACK', targetQn: 'một' },
      { char: '色', isMatched: true, color: 'BLACK', targetQn: 'sắc' }
    ]
  },

  // Page 8 (Contains RED mismatch)
  {
    id: 'rec_8_1',
    pageNumber: 8,
    lineIndex: 0,
    img_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.008.jpg',
    sentence_id: Formatters.buildSentenceId('Ca Trù Thê Cách, AB 160, Nôm_Y.008.jpg', 1),
    SinoNom_Char: '富貴能幾何',
    ChuQN_txt: 'Phú qúi năng kỷ hà',
    isMatched: false,
    color: 'RED',
    reviewStatus: 'pending',
    editorNote: 'Chữ 貴 đọc âm Hán Việt là "quý", bản chép Quốc ngữ ghi chính tả cổ "qúi". Cần thẩm định.',
    charStatuses: [
      { char: '富', isMatched: true, color: 'BLACK', targetQn: 'Phú' },
      { char: '貴', isMatched: false, color: 'RED', targetQn: 'qúi', reason: 'Dị biệt chính tả cổ quý/qúi' },
      { char: '能', isMatched: true, color: 'BLACK', targetQn: 'năng' },
      { char: '幾', isMatched: true, color: 'BLACK', targetQn: 'kỷ' },
      { char: '何', isMatched: true, color: 'BLACK', targetQn: 'hà' }
    ]
  },

  // Page 9 (Contains RED mismatch)
  {
    id: 'rec_9_1',
    pageNumber: 9,
    lineIndex: 0,
    img_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.009.jpg',
    sentence_id: Formatters.buildSentenceId('Ca Trù Thê Cách, AB 160, Nôm_Y.009.jpg', 1),
    SinoNom_Char: '醉後吟句酒聖',
    ChuQN_txt: 'Buổi túy hậu ngâm câu tửu thánh',
    isMatched: false,
    color: 'RED',
    reviewStatus: 'pending',
    editorNote: 'Chữ 醉 trong câu dùng âm Nôm mượn "say" hoặc "buổi túy". Cần đối sánh.',
    charStatuses: [
      { char: '醉', isMatched: false, color: 'RED', targetQn: 'Buổi túy', reason: 'Âm mượn mở rộng' },
      { char: '後', isMatched: true, color: 'BLACK', targetQn: 'hậu' },
      { char: '吟', isMatched: true, color: 'BLACK', targetQn: 'ngâm' },
      { char: '句', isMatched: true, color: 'BLACK', targetQn: 'câu' },
      { char: '酒', isMatched: true, color: 'BLACK', targetQn: 'tửu' },
      { char: '聖', isMatched: true, color: 'BLACK', targetQn: 'thánh' }
    ]
  },

  // Page 11 (Contains RED mismatch)
  {
    id: 'rec_11_1',
    pageNumber: 11,
    lineIndex: 0,
    img_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.011.jpg',
    sentence_id: Formatters.buildSentenceId('Ca Trù Thê Cách, AB 160, Nôm_Y.011.jpg', 1),
    SinoNom_Char: '台台台台',
    ChuQN_txt: 'Một năm mười hai tháng thảnh thơi',
    isMatched: false,
    color: 'RED',
    reviewStatus: 'pending',
    editorNote: 'Chữ 台 (thơi) mượn âm tượng thanh/tượng hình.',
    charStatuses: [
      { char: '台', isMatched: false, color: 'RED', targetQn: 'thảnh thơi', reason: 'Âm Nôm cổ' }
    ]
  },

  // Page 26
  {
    id: 'rec_26_1',
    pageNumber: 26,
    lineIndex: 0,
    img_id: 'Ca Trù Thê Cách, AB 160, Nôm_Y.026.jpg',
    sentence_id: Formatters.buildSentenceId('Ca Trù Thê Cách, AB 160, Nôm_Y.026.jpg', 1),
    SinoNom_Char: '𠳒黃石金壇歌',
    ChuQN_txt: 'Nhời vàng đá lẩn cung đàn tiếng hát',
    isMatched: false,
    color: 'RED',
    reviewStatus: 'pending',
    editorNote: 'Chữ Nôm 𠳒 (khẩu + lời/lợi) đọc âm Nôm là "nhời / lời".',
    charStatuses: [
      { char: '𠳒', isMatched: false, color: 'RED', targetQn: 'Nhời', reason: 'Dị biệt âm Nôm nhời/lời' },
      { char: '黃', isMatched: true, color: 'BLACK', targetQn: 'vàng' },
      { char: '石', isMatched: true, color: 'BLACK', targetQn: 'đá' },
      { char: '金', isMatched: true, color: 'BLACK', targetQn: 'lẩn' },
      { char: '壇', isMatched: true, color: 'BLACK', targetQn: 'cung đàn' },
      { char: '歌', isMatched: true, color: 'BLACK', targetQn: 'tiếng hát' }
    ]
  }
];

// Generate bounding boxes for a given page
export function generateMockBoxesForPage(
  pageNumber: number,
  imgName: string,
  recordsForPage: AlignmentRecord[]
): BoundingBox[] {
  const boxes: BoundingBox[] = [];
  const startY = 120;
  const lineSpacing = 160;

  recordsForPage.forEach((rec, idx) => {
    const yTopCh = startY + idx * lineSpacing;
    const yBotCh = yTopCh + 58;

    const yTopVi = yBotCh + 8;
    const yBotVi = yTopVi + 52;

    // Sino-Nom Box (ch)
    boxes.push({
      id: `box_ch_${pageNumber}_${idx}`,
      img_id: imgName,
      sentence_id: rec.sentence_id,
      region_type: 'ch',
      transcription: rec.SinoNom_Char,
      points: [
        [285, yTopCh],
        [1280, yTopCh],
        [1280, yBotCh],
        [285, yBotCh]
      ],
      confidence: 0.98,
      status: rec.color === 'RED' ? 'mismatched' : 'matched'
    });

    // Quoc Ngu Box (vi)
    boxes.push({
      id: `box_vi_${pageNumber}_${idx}`,
      img_id: imgName,
      sentence_id: rec.sentence_id,
      region_type: 'vi',
      transcription: rec.ChuQN_txt,
      points: [
        [285, yTopVi],
        [1280, yTopVi],
        [1280, yBotVi],
        [285, yBotVi]
      ],
      confidence: 0.96,
      status: rec.color === 'RED' ? 'mismatched' : 'matched'
    });
  });

  return boxes;
}

export function computeMockMetrics(records: AlignmentRecord[]): ProjectMetrics {
  let totalChars = 2538;
  let mismatchedChars = 21;

  // Recalculate based on current edited records
  records.forEach(r => {
    if (r.color === 'RED' && r.reviewStatus === 'approved') {
      // User reviewed & approved, reduce mismatch count
      mismatchedChars = Math.max(0, mismatchedChars - 1);
    }
  });

  const similarityScore = parseFloat(((1 - mismatchedChars / totalChars) * 100).toFixed(2));

  return {
    totalPages: 45,
    processedPages: 45,
    totalAlignedPairs: 369,
    totalSinoNomChars: totalChars,
    totalVietnameseWords: 2542,
    validatedPairs: records.filter(r => r.reviewStatus === 'approved').length,
    mismatchedChars,
    pendingReviews: records.filter(r => r.reviewStatus === 'pending').length,
    similarityScore,
    isSimilarityPassed: similarityScore >= 95.0
  };
}
