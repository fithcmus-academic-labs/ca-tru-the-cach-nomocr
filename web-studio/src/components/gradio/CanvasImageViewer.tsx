import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BoundingBox } from '../../types/annotation';
import { PageDocument } from '../../types/document';

interface CanvasImageViewerProps {
  imageUrl: string;
  pageNumber: number;
  totalPages: number;
  pages: PageDocument[];
  boxes: BoundingBox[];
  selectedSentenceId: string | null;
  onSelectSentence: (sentenceId: string) => void;
  onSelectPage: (pageNumber: number) => void;
}

export const CanvasImageViewer: React.FC<CanvasImageViewerProps> = ({
  imageUrl,
  pageNumber,
  totalPages,
  pages,
  boxes,
  selectedSentenceId,
  onSelectSentence,
  onSelectPage
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageStripRef = useRef<HTMLDivElement>(null);

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(0.28);
  const [panX, setPanX] = useState(15);
  const [panY, setPanY] = useState(15);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragDist, setDragDist] = useState(0);
  const [showBoxes, setShowBoxes] = useState(true);
  const [pageCategoryFilter, setPageCategoryFilter] = useState<'all' | 'content' | 'misc'>('all');

  // Auto-fit function
  const fitImageToContainer = useCallback((img: HTMLImageElement) => {
    if (!containerRef.current) return;
    const cWidth = containerRef.current.clientWidth || 600;
    const cHeight = 560;
    const scale = Math.min((cWidth - 30) / img.width, (cHeight - 30) / img.height);
    const fitZoom = Math.max(scale, 0.15);
    setZoom(fitZoom);
    setPanX(Math.max((cWidth - img.width * fitZoom) / 2, 10));
    setPanY(15);
  }, []);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setImageObj(img);
      fitImageToContainer(img);
    };
  }, [imageUrl, fitImageToContainer]);

  // Strict technical validation: Each bounding box MUST have strictly 4 coordinate points
  const validatedBoxes = boxes.filter((b) => {
    return b.points && Array.isArray(b.points) && b.points.length === 4;
  });

  // Current page object
  const currentPageObj = pages.find((p) => p.pageNumber === pageNumber);

  // Auto-scroll active page button into view in the page strip
  useEffect(() => {
    if (pageStripRef.current) {
      const activeBtn = pageStripRef.current.querySelector(`[data-page="${pageNumber}"]`) as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [pageNumber]);

  // Canvas drawing loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = containerRef.current?.clientWidth || 600;
    const height = 560;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background with soft manuscript backdrop
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // 1. Draw actual real page scan image
    ctx.drawImage(imageObj, 0, 0);

    // 2. Draw T2b red vertical margin separator at x ~ 260px
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2 / zoom;
    ctx.moveTo(260, 0);
    ctx.lineTo(260, imageObj.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw bounding boxes (Strictly 4 points)
    if (showBoxes) {
      validatedBoxes.forEach((box) => {
        const isSelected = box.sentence_id === selectedSentenceId;
        const isRed = box.status === 'mismatched';
        const pts = box.points; // Exactly 4 points [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
        const isVi = box.region_type === 'vi';

        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.lineTo(pts[3][0], pts[3][1]);
        ctx.closePath();

        // Fill
        if (isSelected) {
          ctx.fillStyle = 'rgba(234, 179, 8, 0.28)';
          ctx.fill();
        } else if (isRed) {
          ctx.fillStyle = 'rgba(220, 38, 38, 0.16)';
          ctx.fill();
        } else {
          ctx.fillStyle = isVi ? 'rgba(75, 85, 99, 0.06)' : 'rgba(0, 0, 0, 0.05)';
          ctx.fill();
        }

        // Stroke
        ctx.lineWidth = isSelected ? 3.5 / zoom : isRed ? 2.5 / zoom : 1.5 / zoom;
        ctx.strokeStyle = isSelected ? '#b45309' : isRed ? '#dc2626' : isVi ? '#4b5563' : '#000000';
        if (isVi && !isSelected && !isRed) {
          ctx.setLineDash([5 / zoom, 3 / zoom]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // 4 vertex corner dots (Strict 4 points)
        pts.forEach(([px, py]) => {
          ctx.beginPath();
          ctx.arc(px, py, 3.5 / zoom, 0, 2 * Math.PI);
          ctx.fillStyle = isSelected ? '#b45309' : isRed ? '#dc2626' : isVi ? '#4b5563' : '#000000';
          ctx.fill();
        });

        // Line number label indicator
        const lineNum = box.sentence_id.split('.').pop() || '';
        if (lineNum) {
          ctx.font = `bold ${Math.max(11 / zoom, 9)}px monospace`;
          ctx.fillStyle = isSelected ? '#b45309' : isRed ? '#dc2626' : '#111827';
          const labelTag = `${lineNum} ${isVi ? '(QN)' : '(HN)'}`;
          ctx.fillText(labelTag, pts[0][0] + 4 / zoom, pts[0][1] - 4 / zoom);
        }
      });
    }

    ctx.restore();
  }, [imageObj, panX, panY, zoom, showBoxes, validatedBoxes, selectedSentenceId]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Click on bounding box
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageObj) return;
    if (dragDist > 5) return; // Ignore drag release

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - panX) / zoom;
    const clickY = (e.clientY - rect.top - panY) / zoom;

    // Check hit test against strictly 4-point polygons
    for (const box of validatedBoxes) {
      const minX = Math.min(...box.points.map((p) => p[0]));
      const maxX = Math.max(...box.points.map((p) => p[0]));
      const minY = Math.min(...box.points.map((p) => p[1]));
      const maxY = Math.max(...box.points.map((p) => p[1]));

      if (clickX >= minX && clickX <= maxX && clickY >= minY && clickY <= maxY) {
        onSelectSentence(box.sentence_id);
        break;
      }
    }
  };

  // Keyboard shortcut listener for Zoom In (+) / Zoom Out (-) / Fit Page (0 or F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => Math.min(z * 1.15, 3.0));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((z) => Math.max(z * 0.85, 0.15));
      } else if (e.key === '0' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (imageObj) fitImageToContainer(imageObj);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageObj, fitImageToContainer]);

  // Native wheel listener: Mouse wheel does NOT zoom; prevents page scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheelHandler = (e: WheelEvent) => {
      // Strictly prevent browser page scrolling
      e.preventDefault();
      e.stopPropagation();
      // Smooth vertical pan with wheel if desired
      setPanY((prev) => prev - e.deltaY * 0.6);
    };

    canvas.addEventListener('wheel', onWheelHandler, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheelHandler);
    };
  }, []);

  // Mouse pan handlers (drag freely: horizontal, vertical, diagonal)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setDragDist(0);
      setStartPan({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = Math.abs(e.clientX - (startPan.x + panX));
      const dy = Math.abs(e.clientY - (startPan.y + panY));
      setDragDist((d) => d + dx + dy);
      // Pan freely in all directions (ngang, dọc, xéo)
      setPanX(e.clientX - startPan.x);
      setPanY(e.clientY - startPan.y);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-white border border-gray-300">
      {/* 1. Header with Page Details and Controls */}
      <div className="p-2.5 bg-gray-100 border-b border-gray-300 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div>
          <span className="font-bold text-gray-900">IMAGE VIEWER: PAGE {pageNumber} OF {totalPages}</span>
          <span className="text-gray-600 ml-2">({validatedBoxes.length} BBOXES)</span>
        </div>

        {/* Dropdown Quick Jump */}
        <div className="flex items-center space-x-1">
          <label className="text-gray-600 font-bold">Go to:</label>
          <select
            value={pageNumber}
            onChange={(e) => onSelectPage(Number(e.target.value))}
            className="px-2 py-0.5 bg-white border border-gray-400 font-mono text-xs font-bold text-black"
          >
            {pages.map((p) => (
              <option key={p.pageNumber} value={p.pageNumber}>
                Page {String(p.pageNumber).padStart(2, '0')} - {p.category.toUpperCase()} ({p.detectedChRegions + p.detectedViRegions} boxes{p.mismatchedCount > 0 ? `, ${p.mismatchedCount} red` : ''})
              </option>
            ))}
          </select>
        </div>

        {/* Zoom & BBox Controls */}
        <div className="flex items-center space-x-1">
          <span className="text-gray-500 text-[11px] mr-1">[Keys: +/-]</span>
          <button
            onClick={() => setZoom((z) => Math.max(z * 0.85, 0.15))}
            className="px-2 py-0.5 bg-white border border-gray-400 hover:bg-gray-200"
            title="Zoom Out (Phím -)"
          >
            [ - ]
          </button>
          <span className="w-10 text-center font-bold">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.15, 3.0))}
            className="px-2 py-0.5 bg-white border border-gray-400 hover:bg-gray-200"
            title="Zoom In (Phím +)"
          >
            [ + ]
          </button>
          <button
            onClick={() => {
              if (imageObj) fitImageToContainer(imageObj);
            }}
            className="px-2 py-0.5 bg-white border border-gray-400 hover:bg-gray-200"
            title="Fit Page (Phím 0 hoặc F)"
          >
            [ Fit ]
          </button>
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2 py-0.5 border ${
              showBoxes
                ? 'bg-black text-white border-black font-bold'
                : 'bg-white text-gray-700 border-gray-400'
            }`}
          >
            [ {showBoxes ? 'Hide BBoxes' : 'Show BBoxes'} ]
          </button>
        </div>
      </div>

      {/* 2. Page Group Filter Strip (Tach rieng Trang Dich vs Trang Bia/Misc) */}
      <div className="flex items-center space-x-1 px-2.5 py-1 bg-gray-100 border-b border-gray-300 font-mono text-xs">
        <span className="font-bold text-gray-700 mr-1">NHÓM:</span>
        <button
          onClick={() => setPageCategoryFilter('all')}
          className={`px-2 py-0.5 border ${
            pageCategoryFilter === 'all'
              ? 'bg-black text-white border-black font-bold'
              : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-200'
          }`}
        >
          [ Tất Cả ({pages.length}) ]
        </button>
        <button
          onClick={() => {
            setPageCategoryFilter('content');
            if (currentPageObj?.category !== 'content') {
              const firstContent = pages.find((p) => p.category === 'content');
              if (firstContent) onSelectPage(firstContent.pageNumber);
            }
          }}
          className={`px-2 py-0.5 border ${
            pageCategoryFilter === 'content'
              ? 'bg-black text-white border-black font-bold'
              : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-200'
          }`}
        >
          [ Trang Dịch ({pages.filter((p) => p.category === 'content').length}) ]
        </button>
        <button
          onClick={() => {
            setPageCategoryFilter('misc');
            if (currentPageObj?.category === 'content') {
              const firstMisc = pages.find((p) => p.category !== 'content');
              if (firstMisc) onSelectPage(firstMisc.pageNumber);
            }
          }}
          className={`px-2 py-0.5 border ${
            pageCategoryFilter === 'misc'
              ? 'bg-black text-white border-black font-bold'
              : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-200'
          }`}
        >
          [ Trang Bìa & Phụ ({pages.filter((p) => p.category !== 'content').length}) ]
        </button>
      </div>

      {/* 3. Visual Page Selector Strip (Hien ro tung trang o day) */}
      <div
        ref={pageStripRef}
        className="flex items-center space-x-1 p-2 bg-gray-50 border-b border-gray-300 overflow-x-auto font-mono text-xs select-none"
      >
        <span className="font-bold text-gray-800 shrink-0 mr-1">
          {pageCategoryFilter === 'content'
            ? 'TRANG DỊCH:'
            : pageCategoryFilter === 'misc'
            ? 'TRANG BÌA/PHỤ:'
            : 'TẤT CẢ TRANG:'}
        </span>
        {pages
          .filter((p) => {
            if (pageCategoryFilter === 'content') return p.category === 'content';
            if (pageCategoryFilter === 'misc') return p.category !== 'content';
            return true;
          })
          .map((p) => {
            const isCurrent = p.pageNumber === pageNumber;
            const hasIssues = p.mismatchedCount > 0;
            const isContent = p.category === 'content';

            return (
              <button
                key={p.pageNumber}
                data-page={p.pageNumber}
                onClick={() => onSelectPage(p.pageNumber)}
                className={`px-2 py-1 shrink-0 border text-[11px] font-mono transition text-center ${
                  isCurrent
                    ? 'bg-black text-white border-black font-bold ring-2 ring-black'
                    : hasIssues
                    ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 font-semibold'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-200'
                }`}
                title={`${p.imgName} | Type: ${p.category} | ${p.detectedChRegions + p.detectedViRegions} boxes | ${p.mismatchedCount} issues`}
              >
                <span>{isCurrent ? `[ > P.${String(p.pageNumber).padStart(2, '0')} < ]` : `P.${String(p.pageNumber).padStart(2, '0')}`}</span>
                {isContent ? (
                  <span className={`ml-1 text-[10px] ${isCurrent ? 'text-gray-300' : hasIssues ? 'text-red-700 font-bold' : 'text-gray-500'}`}>
                    ({p.detectedChRegions})
                  </span>
                ) : (
                  <span className="ml-1 text-[9px] uppercase opacity-60">({p.category})</span>
                )}
              </button>
            );
          })}
      </div>

      {/* 3. Page Metadata Info Bar */}
      <div className="px-3 py-1 bg-gray-100 border-b border-gray-200 text-[11px] font-mono text-gray-700 flex items-center justify-between">
        <span className="truncate">
          FILE: <b>{currentPageObj?.imgName || `Page_${pageNumber}.jpg`}</b>
        </span>
        <span className="shrink-0 ml-2">
          CATEGORY: <b>{(currentPageObj?.category || 'CONTENT').toUpperCase()}</b> | BOXES: <b>{validatedBoxes.length}</b> (CH: {validatedBoxes.filter(b => b.region_type === 'ch').length}, VI: {validatedBoxes.filter(b => b.region_type === 'vi').length})
        </span>
      </div>

      {/* 4. Canvas Container */}
      <div
        className="flex-1 overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={`w-full h-[560px] select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        />
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-gray-700 bg-white/95 px-2 py-0.5 border border-gray-300 select-none">
          Pan: Rê chuột kéo ảnh (ngang/dọc/xéo) | Zoom: Phím [+] / [-] | Fit: Phím [0]
        </div>
      </div>
    </div>
  );
};
