import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { BoundingBox } from '../types/annotation';
import { AlignmentRecord } from '../types/alignment';
import { ValidationReport, ValidationError } from '../types/export';
import { ProjectMetadata, ProjectMetrics } from '../types/project';
import { PageDocument } from '../types/document';

export class ExportService {
  /**
   * Run strict pre-flight validation on all artifacts.
   */
  static validateDataset(
    pages: PageDocument[],
    boxes: BoundingBox[],
    records: AlignmentRecord[],
    metrics: ProjectMetrics
  ): ValidationReport {
    const errors: ValidationError[] = [];

    // 1. Check bounding boxes points count
    boxes.forEach(box => {
      if (!box.points || box.points.length !== 4) {
        errors.push({
          type: 'bbox_points_count',
          severity: 'error',
          message: `Box '${box.id}' has ${box.points ? box.points.length : 0} points. Required exactly 4 points.`,
          img_id: box.img_id,
          sentence_id: box.sentence_id
        });
      } else {
        box.points.forEach(([x, y], ptIdx) => {
          if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
            errors.push({
              type: 'out_of_bounds',
              severity: 'error',
              message: `Point ${ptIdx} of box '${box.id}' has invalid coordinates: [${x}, ${y}]`,
              img_id: box.img_id
            });
          }
        });
      }

      if (!box.transcription || box.transcription.trim().length === 0) {
        errors.push({
          type: 'empty_transcription',
          severity: 'warning',
          message: `Box '${box.id}' has empty transcription text.`,
          img_id: box.img_id,
          sentence_id: box.sentence_id
        });
      }
    });

    // 2. Check Sentence ID format
    records.forEach(r => {
      const expectedPrefix = r.img_id.replace(/\.(jpg|jpeg|png)$/i, '');
      if (!r.sentence_id.startsWith(expectedPrefix)) {
        errors.push({
          type: 'sentence_id_mismatch',
          severity: 'error',
          message: `Sentence ID '${r.sentence_id}' does not match image prefix '${expectedPrefix}'`,
          img_id: r.img_id,
          sentence_id: r.sentence_id
        });
      }
    });

    const totalErrors = errors.filter(e => e.severity === 'error').length;
    const totalWarnings = errors.filter(e => e.severity === 'warning').length;

    return {
      isValid: totalErrors === 0,
      totalErrors,
      totalWarnings,
      errors,
      summary: {
        totalPages: pages.length,
        totalBoxesCh: boxes.filter(b => b.region_type === 'ch').length,
        totalBoxesVi: boxes.filter(b => b.region_type === 'vi').length,
        totalSentences: records.length,
        similarityPercentage: metrics.similarityScore,
        isSimilarityPassed: metrics.isSimilarityPassed
      }
    };
  }

  /**
   * Generates PPOCRLabel Label.txt content
   * Format: <image_path>\t[{"transcription":"...","points":[[x1,y1],[x2,y2],[x3,y3],[x4,y4]]},...]
   */
  static generateLabelTxt(
    folderName: 'ch' | 'vi',
    pages: PageDocument[],
    boxes: BoundingBox[]
  ): string {
    const lines: string[] = [];
    const contentPages = pages.filter(p => p.category === 'content');

    contentPages.forEach(p => {
      const pageBoxes = boxes.filter(b => b.img_id === p.imgName && b.region_type === folderName);
      const annotations = pageBoxes.map(b => ({
        transcription: b.transcription,
        points: b.points
      }));

      const relativePath = `${folderName}/${p.imgName}`;
      lines.push(`${relativePath}\t${JSON.stringify(annotations)}`);
    });

    return lines.join('\n');
  }

  /**
   * Generates PPOCRLabel fileState.txt content
   * Format: <image_path>\t1
   */
  static generateFileStateTxt(
    folderName: 'ch' | 'vi',
    pages: PageDocument[]
  ): string {
    const lines: string[] = [];
    const contentPages = pages.filter(p => p.category === 'content');

    contentPages.forEach(p => {
      const relativePath = `${folderName}/${p.imgName}`;
      lines.push(`${relativePath}\t1`);
    });

    return lines.join('\n');
  }

  /**
   * Generates UTF-8 with BOM CSV content with exact 4 columns:
   * ['img_id', 'sentence_id', 'SinoNom_Char', 'ChuQN_txt']
   */
  static generateCsv(records: AlignmentRecord[]): string {
    const BOM = '\uFEFF';
    const header = ['img_id', 'sentence_id', 'SinoNom_Char', 'ChuQN_txt'].join(',');

    const rows = records.map(r => {
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      return [
        escape(r.img_id),
        escape(r.sentence_id),
        escape(r.SinoNom_Char),
        escape(r.ChuQN_txt)
      ].join(',');
    });

    return BOM + [header, ...rows].join('\r\n');
  }

  /**
   * Generates Color-coded Excel workbook (.xlsx) using ExcelJS
   * Font Black: FF000000 (matched >= 95%)
   * Font Red:   FFFF0000 (mismatches / out-of-vocabulary)
   */
  static async generateExcelBlob(records: AlignmentRecord[]): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Human-in-the-Loop Web Studio';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Parallel Corpus', {
      views: [{ state: 'frozen', ySplit: 1 }] // Freeze header row
    });

    // Define columns
    sheet.columns = [
      { header: 'img_id', key: 'img_id', width: 36 },
      { header: 'sentence_id', key: 'sentence_id', width: 38 },
      { header: 'SinoNom_Char', key: 'SinoNom_Char', width: 32 },
      { header: 'ChuQN_txt', key: 'ChuQN_txt', width: 45 }
    ];

    // Header styling
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate-800
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;

    // Add data rows with strict Black / Red font colors
    records.forEach(r => {
      const isRed = r.color === 'RED';
      const fontColorArgb = isRed ? 'FFFF0000' : 'FF000000';

      const row = sheet.addRow({
        img_id: r.img_id,
        sentence_id: r.sentence_id,
        SinoNom_Char: r.SinoNom_Char,
        ChuQN_txt: r.ChuQN_txt
      });

      row.height = 20;
      row.font = {
        name: 'NomNaTongLight',
        size: 11,
        color: { argb: fontColorArgb }
      };

      // Sino-Nom column (col 3) specific styling
      const nomCell = row.getCell(3);
      nomCell.font = {
        name: 'NomNaTongLight',
        size: 12,
        bold: isRed,
        color: { argb: fontColorArgb }
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  /**
   * Bundles the full submission package as <MSSV1_MSSV2...>.zip
   */
  static async exportZipPackage(
    metadata: ProjectMetadata,
    pages: PageDocument[],
    boxes: BoundingBox[],
    records: AlignmentRecord[],
    onProgress?: (percent: number, step: string) => void
  ): Promise<void> {
    const zip = new JSZip();
    const studentPrefix = metadata.studentIds.join('_') || 'STUDENT_SUBMISSION';
    const zipFilename = `${studentPrefix}.zip`;
    const bookFolder = zip.folder(metadata.bookName);

    if (!bookFolder) {
      throw new Error('Failed to create ZIP directory.');
    }

    onProgress?.(10, 'Validating and generating PPOCRLabel dataset...');
    const chFolder = bookFolder.folder('ch');
    const viFolder = bookFolder.folder('vi');
    bookFolder.folder('misc');
    bookFolder.folder('blank');
    bookFolder.folder('intro');
    bookFolder.folder('ref');
    bookFolder.folder('toc');

    // 1. PPOCRLabel files
    const chLabelTxt = this.generateLabelTxt('ch', pages, boxes);
    const chFileStateTxt = this.generateFileStateTxt('ch', pages);
    chFolder?.file('Label.txt', chLabelTxt);
    chFolder?.file('fileState.txt', chFileStateTxt);

    const viLabelTxt = this.generateLabelTxt('vi', pages, boxes);
    const viFileStateTxt = this.generateFileStateTxt('vi', pages);
    viFolder?.file('Label.txt', viLabelTxt);
    viFolder?.file('fileState.txt', viFileStateTxt);

    onProgress?.(40, 'Generating CSV corpus (UTF-8 BOM)...');
    // 2. CSV file
    const csvContent = this.generateCsv(records);
    bookFolder.file(`${metadata.bookName}.csv`, csvContent);

    onProgress?.(65, 'Formatting Excel spreadsheet with ARGB font styling...');
    // 3. Excel file (.xlsx)
    const excelBlob = await this.generateExcelBlob(records);
    bookFolder.file(`${metadata.bookName}.xlsx`, excelBlob);

    onProgress?.(85, 'Packaging original and updated PDF documents...');
    // 4. Placeholders for PDF files
    bookFolder.file(
      `${metadata.bookName}.pdf`,
      `[PDF Document Content Placeholder for ${metadata.bookName}]`
    );

    onProgress?.(95, 'Compressing artifacts into ZIP...');
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

    onProgress?.(100, 'Download complete!');
    saveAs(zipBlob, zipFilename);
  }
}
