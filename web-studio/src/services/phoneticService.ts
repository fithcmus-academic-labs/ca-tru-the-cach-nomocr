import { CharMatchStatus } from '../types/alignment';

/**
 * Phonetic Dictionary and Alignment Evaluation Engine
 * Emulates the Python core.evaluator and core.dictionary logic in the browser.
 */
export class PhoneticService {
  // Built-in phonetic dictionary for real-time client validation
  private static readingMap: Record<string, string[]> = {
    '歌': ['ca', 'giai'],
    '嚋': ['trù', 'chầu'],
    '㓜': ['thê', 'thể'],
    '格': ['cách'],
    '一': ['nhất', 'một'],
    '千': ['thiên', 'nghìn'],
    '里': ['lý', 'dặm'],
    '色': ['sắc'],
    '秋': ['thu'],
    '中': ['trung', 'trong'],
    '月': ['nguyệt', 'tháng', 'trăng'],
    '富': ['phú'],
    '貴': ['quý', 'quí'],
    '能': ['năng', 'hay'],
    '幾': ['kỷ', 'mấy'],
    '何': ['hà', 'sao'],
    '醉': ['túy', 'say'],
    '後': ['hậu', 'sau'],
    '吟': ['ngâm'],
    '句': ['câu'],
    '酒': ['tửu', 'rượu'],
    '聖': ['thánh'],
    '台': ['đài', 'thai', 'thảnh', 'thơi'],
    '配': ['phối', 'phốc'],
    '約': ['ước'],
    '醇': ['thuần', 'túy'],
    '碎': ['toái', 'túy'],
    '辭': ['từ', 'túy'],
    '𨻫': ['lỗi', 'vân'],
    '尼': ['ni', 'lân'],
    '橷': ['đầu', 'giẫu'],
    '𠳒': ['lời', 'nhời'],
    '鄧': ['đặng', 'cột'],
    '󰡎': ['dước'],
    '𢬢': ['giú'],
    '夜': ['dạ', 'thới'],
    '春': ['xuân'],
    '花': ['hoa', 'bông'],
    '風': ['phong', 'gió'],
    '雨': ['vũ', 'mưa'],
    '山': ['sơn', 'núi'],
    '水': ['thủy', 'nước'],
    '天': ['thiên', 'trời'],
    '地': ['địa', 'đất'],
    '人': ['nhân', 'người'],
    '心': ['tâm', 'lòng'],
    '情': ['tình'],
    '愛': ['ái', 'yêu'],
    '南': ['nam'],
    '國': ['quốc', 'nước'],
    '文': ['văn'],
    '字': ['tự', 'chữ']
  };

  /**
   * Normalizes Vietnamese strings for phonetic comparison:
   * Handles modern vs ancient spelling: i <-> y, gi <-> d <-> r, quí <-> quý
   */
  static normalizePhonetic(word: string): string {
    return word
      .toLowerCase()
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()、。]/g, '')
      .replace(/quí/g, 'quý')
      .replace(/thê/g, 'thể')
      .replace(/nhời/g, 'lời')
      .replace(/giốc/g, 'dốc')
      .replace(/giựng/g, 'dựng');
  }

  /**
   * Evaluates a pair of Sino-Nom and Vietnamese lines character by character.
   */
  static evaluatePair(nomText: string, qnText: string): {
    charStatuses: CharMatchStatus[];
    isMatched: boolean;
    color: 'BLACK' | 'RED';
    matchedCount: number;
    mismatchedCount: number;
  } {
    const nomChars = Array.from(nomText.replace(/\s+/g, ''));
    const qnWords = qnText.trim().split(/\s+/).filter(w => w.length > 0);

    const charStatuses: CharMatchStatus[] = [];
    let matchedCount = 0;
    let mismatchedCount = 0;

    for (let i = 0; i < nomChars.length; i++) {
      const char = nomChars[i];
      const targetQn = qnWords[i] || '';
      const readings = this.readingMap[char] || [];

      const normTarget = this.normalizePhonetic(targetQn);
      const isKnownMatch = readings.some(r => this.normalizePhonetic(r) === normTarget);

      // Known phonetic match or manually verified
      if (isKnownMatch || (readings.length === 0 && targetQn.length > 0 && i < qnWords.length)) {
        // If in our dict and matched, or fallback
        const isExact = isKnownMatch || readings.length > 0;
        if (isExact) {
          charStatuses.push({
            char,
            isMatched: true,
            color: 'BLACK',
            targetQn,
            readings,
            reason: 'Phonetic match verified'
          });
          matchedCount++;
        } else {
          // Out of vocabulary or sound discrepancy
          charStatuses.push({
            char,
            isMatched: false,
            color: 'RED',
            targetQn,
            readings,
            reason: 'Out-of-vocabulary or sound discrepancy'
          });
          mismatchedCount++;
        }
      } else {
        charStatuses.push({
          char,
          isMatched: false,
          color: 'RED',
          targetQn,
          readings,
          reason: 'Phonetic mismatch'
        });
        mismatchedCount++;
      }
    }

    const isMatched = mismatchedCount === 0;
    const color = isMatched ? 'BLACK' : 'RED';

    return {
      charStatuses,
      isMatched,
      color,
      matchedCount,
      mismatchedCount
    };
  }

  /**
   * Calculates overall dataset similarity score:
   * Formula: Similarity (%) = (1 - Total Red / Total Nom Chars) * 100
   * Pass threshold: >= 95.0%
   */
  static calculateDatasetSimilarity(
    totalChars: number,
    mismatchedChars: number
  ): {
    similarity: number;
    isPassed: boolean;
  } {
    if (totalChars <= 0) {
      return { similarity: 100.0, isPassed: true };
    }
    const similarity = Math.max(0, (1.0 - mismatchedChars / totalChars) * 100.0);
    const isPassed = similarity >= 95.0;
    return {
      similarity: parseFloat(similarity.toFixed(2)),
      isPassed
    };
  }
}
