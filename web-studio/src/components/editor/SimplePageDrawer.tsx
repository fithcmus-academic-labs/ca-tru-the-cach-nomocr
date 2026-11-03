import React, { useState } from 'react';
import { X, Search, AlertCircle, Layers, CheckCircle2 } from 'lucide-react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { useProjectStore } from '../../store/useProjectStore';

interface SimplePageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimplePageDrawer: React.FC<SimplePageDrawerProps> = ({ isOpen, onClose }) => {
  const { pages, currentPageNumber, setCurrentPageNumber } = useDocumentStore();
  const { loadBoxesForPage } = useAnnotationStore();
  const { metadata } = useProjectStore();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'issues_only' | 'content_only'>('all');

  if (!isOpen) return null;

  const filteredPages = pages.filter(p => {
    if (filterMode === 'issues_only' && p.mismatchedCount === 0) return false;
    if (filterMode === 'content_only' && p.category !== 'content') return false;
    if (search.trim()) {
      return String(p.pageNumber).includes(search) || p.imgName.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const handleSelectPage = (pageNum: number) => {
    setCurrentPageNumber(pageNum);
    loadBoxesForPage(metadata.id, pageNum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-2xs flex">
      <div className="w-80 bg-white h-full shadow-2xl border-r border-slate-200 flex flex-col animate-in slide-in-from-left duration-200 select-none">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Danh Sách 45 Trang Bản Thảo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhanh trang (vd: 6)..."
              className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="flex items-center space-x-1 text-[11px]">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1 rounded text-center font-medium transition ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({pages.length})
            </button>
            <button
              onClick={() => setFilterMode('issues_only')}
              className={`flex-1 py-1 rounded text-center font-medium transition ${
                filterMode === 'issues_only'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Cần sửa ({pages.filter(p => p.mismatchedCount > 0).length})
            </button>
          </div>
        </div>

        {/* Page List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredPages.map(page => {
            const isSelected = page.pageNumber === currentPageNumber;
            const hasIssues = page.mismatchedCount > 0;

            return (
              <div
                key={page.pageNumber}
                onClick={() => handleSelectPage(page.pageNumber)}
                className={`p-2 rounded-lg cursor-pointer transition flex items-center space-x-3 border ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                    : 'bg-white hover:bg-slate-50 border-slate-100'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-15 bg-slate-100 rounded border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                  <img
                    src={page.imageUrl}
                    alt={`P${page.pageNumber}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[10px] text-white text-center font-mono py-0.5 font-bold">
                    {page.pageNumber}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      Trang {page.pageNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {page.pageId}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                      page.category === 'content'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {page.category === 'content' ? 'Nội dung' : 'Bìa / Mục lục'}
                    </span>

                    <span className="text-[10px] text-slate-500">
                      {page.detectedChRegions} câu
                    </span>
                  </div>

                  {hasIssues ? (
                    <div className="flex items-center space-x-1 text-[10px] text-rose-600 font-semibold mt-1">
                      <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{page.mismatchedCount} câu có chữ đỏ</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-[10px] text-emerald-600 font-medium mt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>Chuẩn xác</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
