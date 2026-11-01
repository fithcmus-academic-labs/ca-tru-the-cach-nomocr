export class Formatters {
  /**
   * Generates sentence_id following strict academic rule:
   * <img_id without .jpg>.<index>
   * Example: Ca Trù Thê Cách, AB 160, Nôm_Y.006.1
   */
  static buildSentenceId(imgId: string, index: number): string {
    const base = imgId.replace(/\.(jpg|jpeg|png)$/i, '');
    return `${base}.${index}`;
  }

  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static formatSimilarity(score: number): string {
    return `${score.toFixed(2)}%`;
  }
}
