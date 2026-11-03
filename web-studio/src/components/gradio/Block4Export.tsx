import React, { useState } from 'react';
import { ProjectMetadata } from '../../types/project';
import { PageDocument } from '../../types/document';
import { BoundingBox } from '../../types/annotation';
import { AlignmentRecord } from '../../types/alignment';
import { ExportService } from '../../services/exportService';
import { getBookDataset, BookKey } from '../../services/realDataset';

interface Block4ExportProps {
  metadata: ProjectMetadata;
  pages: PageDocument[];
  boxes: BoundingBox[];
  records: AlignmentRecord[];
  isBackendConnected: boolean;
}

export const Block4Export: React.FC<Block4ExportProps> = ({
  metadata,
  pages,
  boxes,
  records,
  isBackendConnected
}) => {
  const [studentIdsInput, setStudentIdsInput] = useState(metadata.studentIds.join('_') || 'PROJECT_DEV_01_PROJECT_DEV_02');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsExporting(true);
    setExportMessage('[INFO] Packaging deliverable zip archive with academic structure...');

    try {
      const studentPrefix = studentIdsInput.trim() || 'PROJECT_DEV_01_PROJECT_DEV_02';
      const studentIds = studentPrefix.split('_').filter(Boolean);

      if (isBackendConnected) {
        window.open(`http://localhost:8000/api/projects/${metadata.id}/export`, '_blank');
        setExportMessage(`[SUCCESS] Backend export initiated: ${studentPrefix}.zip`);
      } else {
        const metaToExport: ProjectMetadata = {
          ...metadata,
          studentIds: studentIds
        };
        const targetKey = ((metadata as any).bookKey as BookKey) || 'NOM_Y';
        const bookData = getBookDataset(targetKey);
        const fullBoxes = Object.values(bookData.boxesByPage).flat();
        await ExportService.exportZipPackage(metaToExport, pages, fullBoxes.length > 0 ? fullBoxes : boxes, records);
        setExportMessage(`[SUCCESS] Đã tạo và tải file: ${studentPrefix}.zip (chứa /ch, /vi, /misc, Label.txt, fileState.txt, CSV và XLSX với ${pages.length} trang).`);
      }
    } catch (err: any) {
      setExportMessage(`[ERROR] Export failed: ${err.message || String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-300 p-6 space-y-4">
      <div className="border-b border-gray-300 pb-2">
        <h2 className="text-sm font-bold text-gray-900 uppercase">
          6. Export (Xuat du lieu)
        </h2>
      </div>

      {/* Student ID input */}
      <div className="flex items-center space-x-3 text-xs font-mono">
        <label className="font-bold text-gray-700">MSSV (Student IDs):</label>
        <input
          type="text"
          value={studentIdsInput}
          onChange={(e) => setStudentIdsInput(e.target.value)}
          placeholder="PROJECT_DEV_01_PROJECT_DEV_02"
          className="px-3 py-1.5 border border-gray-400 bg-gray-50 text-black font-mono w-64 focus:outline-none focus:border-black"
        />
        <span className="text-gray-500">Output Archive: {studentIdsInput || 'MSSV'}.zip</span>
      </div>

      {/* Large Plain Text Export Button */}
      <div>
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full py-4 px-6 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 font-mono text-base font-bold text-center border-2 border-black transition"
        >
          {isExporting ? '[ EXPORTING ZIP ARCHIVE... ]' : '[ DOWNLOAD OUTPUT ZIP ]'}
        </button>
      </div>

      {/* Status Output */}
      {exportMessage && (
        <div className="p-3 bg-gray-100 border border-gray-300 font-mono text-xs text-gray-800">
          {exportMessage}
        </div>
      )}
    </div>
  );
};
