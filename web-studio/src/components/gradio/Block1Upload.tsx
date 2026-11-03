import React, { useRef, useState } from 'react';
import { BOOK_OPTIONS, BookKey } from '../../services/realDataset';

interface Block1UploadProps {
  onFileUploaded: (file: { name: string; bookKey?: BookKey }) => void;
  isProcessing: boolean;
  uploadedFileName?: string;
  activeBookKey?: BookKey;
}

export const Block1Upload: React.FC<Block1UploadProps> = ({
  onFileUploaded,
  isProcessing,
  uploadedFileName,
  activeBookKey = 'NOM_Y'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Chỉ chấp nhận file định dạng .pdf');
      return;
    }
    setErrorMessage(null);
    onFileUploaded({ name: file.name });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectBook = (opt: typeof BOOK_OPTIONS[0], e: React.MouseEvent) => {
    e.stopPropagation();
    onFileUploaded({ name: opt.pdfName, bookKey: opt.key });
  };

  return (
    <div className="w-full bg-white border border-gray-300 p-5 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-gray-300 pb-2">
        <h2 className="text-sm font-bold text-gray-900 uppercase">
          1. Tải tài liệu (Upload PDF)
        </h2>
        {uploadedFileName && (
          <span className="text-gray-700 font-bold">
            [ Sách hiện tại: {uploadedFileName} ]
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleChange}
        className="hidden"
      />

      {/* Drag & Drop Area */}
      <div
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`w-full py-8 px-4 border-2 border-dashed text-center transition cursor-pointer ${
          isDragOver
            ? 'border-black bg-gray-100'
            : isProcessing
            ? 'border-gray-400 bg-gray-50 cursor-wait'
            : 'border-gray-400 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className="text-sm font-bold text-gray-900">
          {isProcessing ? 'Tiến trình: Đang xử lý Pipeline...' : 'Upload PDF File'}
        </div>
        <div className="text-[11px] text-gray-500 mt-1">
          {uploadedFileName ? (
            <span className="font-bold text-black">Tập tin đã chọn: {uploadedFileName}</span>
          ) : (
            'Nhấn vào đây hoặc kéo thả file .pdf vào khung'
          )}
        </div>
      </div>

      {/* Quick 4 Book Selection Buttons */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] text-gray-600 font-bold uppercase">
            Hoặc chọn nhanh 1 trong 4 sách trong kho ngữ liệu:
          </div>
          <button
            type="button"
            onClick={() => {
              const opt = BOOK_OPTIONS.find((b) => b.key === activeBookKey) || BOOK_OPTIONS[2];
              onFileUploaded({ name: opt.pdfName, bookKey: opt.key });
            }}
            disabled={isProcessing}
            className="px-2.5 py-1 bg-black text-white hover:bg-gray-800 disabled:opacity-40 font-bold border border-black text-[11px] transition"
          >
            [ KÍCH HOẠT CHẠY PIPELINE CHO SÁCH ĐÃ CHỌN ]
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {BOOK_OPTIONS.map((opt) => {
            const isSelected = activeBookKey === opt.key && uploadedFileName?.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={(e) => handleSelectBook(opt, e)}
                disabled={isProcessing}
                className={`p-2.5 text-left border transition ${
                  isSelected
                    ? 'bg-black text-white border-black font-bold'
                    : 'bg-gray-50 text-gray-900 border-gray-300 hover:bg-gray-200 hover:border-black'
                }`}
              >
                <div className="font-bold truncate text-[11px]">{opt.title}</div>
                <div className="text-[10px] mt-0.5 opacity-80">
                  {opt.pages} trang &bull; {opt.rows} câu đối chiếu
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="text-[11px] font-bold text-red-600">
          [LỖI] {errorMessage}
        </div>
      )}
    </div>
  );
};
