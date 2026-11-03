import React from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Layers
} from 'lucide-react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { useProjectStore } from '../../store/useProjectStore';
import { PageCategory } from '../../types/document';

export const DocumentSidebar: React.FC = () => {
  const { 
    pages, 
    currentPageNumber, 
    setCurrentPageNumber, 
    filterCategory, 
    setFilterCategory, 
    searchQuery, 
    setSearchQuery 
  } = useDocumentStore();

  const { loadBoxesForPage } = useAnnotationStore();
  const { metadata } = useProjectStore();

  // Filter pages
  const filteredPages = pages.filter(p => {
    if (filterCategory !== 'all' && p.category !== filterCategory) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchNum = String(p.pageNumber).includes(q);
      const matchId = p.pageId.toLowerCase().includes(q);
      const matchName = p.imgName.toLowerCase().includes(q);
      if (!matchNum && !matchId && !matchName) return false;
    }
    return true;
  });

  const handleSelectPage = async (pageNumber: number) => {
    setCurrentPageNumber(pageNumber);
    await loadBoxesForPage(metadata.id, pageNumber);
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-full select-none shrink-0">
      {/* Header and Filter bar */}
      <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Document Pages ({pages.length})</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {filteredPages.length} listed
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search page (e.g. 6)..."
            className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1">
          <Filter className="w-3 h-3 text-slate-400 shrink-0" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as PageCategory | 'all')}
            className="text-[11px] bg-white border border-slate-200 rounded px-2 py-1 text-slate-600 w-full focus:outline-none"
          >
            <option value="all">All Pages (45)</option>
            <option value="content">Content Pages (42)</option>
            <option value="misc">Misc / Covers (3)</option>
            <option value="blank">Blank Pages (0)</option>
          </select>
        </div>
      </div>

      {/* Pages Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
        {filteredPages.map(page => {
          const isSelected = page.pageNumber === currentPageNumber;
          const isContent = page.category === 'content';

          return (
            <div
              key={page.pageNumber}
              onClick={() => handleSelectPage(page.pageNumber)}
              className={`p-2.5 rounded-md cursor-pointer transition flex items-center space-x-2.5 ${
                isSelected
                  ? 'bg-emerald-50 border border-emerald-300 shadow-2xs'
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              {/* Thumbnail preview */}
              <div className="w-10 h-13 bg-slate-100 border border-slate-300 rounded overflow-hidden relative shrink-0 flex items-center justify-center">
                <img
                  src={page.imageUrl}
                  alt={`P${page.pageNumber}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-[9px] text-white text-center font-mono py-0.5">
                  {page.pageNumber}
                </span>
              </div>

              {/* Page info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold truncate ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                    Page {page.pageNumber}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {page.pageId}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 mt-1">
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                      page.category === 'content'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : page.category === 'misc'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {page.category}
                  </span>

                  {isContent && (
                    <span className="text-[10px] text-slate-500">
                      {page.detectedChRegions + page.detectedViRegions} boxes
                    </span>
                  )}
                </div>

                {/* Mismatched alert badge */}
                {page.mismatchedCount > 0 && (
                  <div className="flex items-center space-x-1 text-[10px] text-rose-600 font-medium mt-1">
                    <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>{page.mismatchedCount} issue(s) detected</span>
                  </div>
                )}
              </div>

              <ChevronRight className={`w-4 h-4 shrink-0 transition ${isSelected ? 'text-emerald-600 translate-x-0.5' : 'text-slate-300'}`} />
            </div>
          );
        })}
      </div>
    </aside>
  );
};
