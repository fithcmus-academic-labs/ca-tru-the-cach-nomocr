import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAlignmentStore } from '../../store/useAlignmentStore';
import { GeometryUtils } from '../../utils/geometry';
import { Point2D, Polygon4Points, BoundingBox } from '../../types/annotation';

interface CanvasViewerProps {
  zoom: number;
  panX: number;
  panY: number;
  isPanMode: boolean;
  onUpdateTransform: (zoom: number, panX: number, panY: number) => void;
  onOpenEditModal: () => void;
}

export const CanvasViewer: React.FC<CanvasViewerProps> = ({
  zoom,
  panX,
  panY,
  isPanMode,
  onUpdateTransform,
  onOpenEditModal
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { 
    boxes, 
    selectedBoxId, 
    setSelectedBoxId, 
    hoveredBoxId, 
    setHoveredBoxId, 
    activeAnchorIndex, 
    setActiveAnchorIndex,
    visibleRegion,
    updateBoxPoints,
    moveBoxVertex,
    translateBox,
    addBox,
    isDrawingMode
  } = useAnnotationStore();

  const { getCurrentPage } = useDocumentStore();
  const { setSelectedSentenceId } = useAlignmentStore();

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(false);
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point2D>([0, 0]);
  const [spacePressed, setSpacePressed] = useState(false);

  const currentPage = getCurrentPage();

  // Load page image
  useEffect(() => {
    if (!currentPage) return;
    const img = new Image();
    img.src = currentPage.imageUrl;
    img.onload = () => {
      setImageObj(img);
    };
  }, [currentPage]);

  // Space key listener for pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Filter boxes by region
  const visibleBoxes = boxes.filter(b => {
    if (visibleRegion === 'none') return false;
    if (visibleRegion === 'all') return true;
    return b.region_type === visibleRegion;
  });

  // Render Canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Apply Zoom & Pan
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // 1. Draw Image
    ctx.drawImage(imageObj, 0, 0, imageObj.width, imageObj.height);

    // 2. Draw T2b red notebook margin indicator
    ctx.save();
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.4)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.beginPath();
    ctx.moveTo(260, 0);
    ctx.lineTo(260, imageObj.height);
    ctx.stroke();
    ctx.restore();

    // 3. Draw Bounding Boxes
    visibleBoxes.forEach(box => {
      const isSelected = box.id === selectedBoxId;
      const isHovered = box.id === hoveredBoxId;
      const isCh = box.region_type === 'ch';
      const isMismatch = box.status === 'mismatched';

      ctx.save();
      ctx.beginPath();
      const [p0, p1, p2, p3] = box.points;
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.closePath();

      // Box Styling
      let strokeColor = isCh ? '#059669' : '#2563eb';
      let fillColor = isCh ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.12)';

      if (isMismatch) {
        strokeColor = '#dc2626';
        fillColor = 'rgba(220, 38, 38, 0.16)';
      }

      if (isSelected) {
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = '#f59e0b'; // Gold outline
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();

        // Glowing outer shadow
        ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
        ctx.shadowBlur = 10;
        ctx.stroke();
      } else {
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = (isHovered ? 2.5 : 1.8) / zoom;
        ctx.stroke();
      }

      // Draw anchor handles on selected box
      if (isSelected) {
        box.points.forEach(([vx, vy], aIdx) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(vx, vy, 5 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = aIdx === activeAnchorIndex ? '#dc2626' : '#d97706';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
          ctx.restore();
        });

        // Floating Transcription Tag
        ctx.save();
        ctx.font = `${Math.max(12, 14 / zoom)}px ${isCh ? 'NomNaTongLight, serif' : 'sans-serif'}`;
        const tagText = `${isCh ? '[Nôm]' : '[QN]'} ${box.transcription || '(rỗng)'}`;
        const textMetrics = ctx.measureText(tagText);
        const tagWidth = textMetrics.width + 12 / zoom;
        const tagHeight = 22 / zoom;
        const tagX = p0[0];
        const tagY = p0[1] - tagHeight - (4 / zoom);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(tagX, tagY, tagWidth, tagHeight);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(tagText, tagX + 6 / zoom, tagY + 15 / zoom);
        ctx.restore();
      }

      ctx.restore();
    });

    ctx.restore();
  }, [
    imageObj,
    panX,
    panY,
    zoom,
    visibleBoxes,
    selectedBoxId,
    hoveredBoxId,
    activeAnchorIndex
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.2, Math.min(zoom * zoomFactor, 4.0));

    // Zoom centered at mouse cursor
    const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);

    onUpdateTransform(newZoom, newPanX, newPanY);
  };

  // Handle Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    setLastMousePos([clientX, clientY]);

    // Pan mode (middle button, space held, or pan tool active)
    if (e.button === 1 || spacePressed || isPanMode) {
      setIsPanning(true);
      return;
    }

    if (e.button !== 0) return; // Left click only

    const imgPt = GeometryUtils.canvasToImage([clientX, clientY], zoom, panX, panY);

    // 1. Check if an anchor of the currently selected box was hit
    if (selectedBoxId) {
      const selectedBox = boxes.find(b => b.id === selectedBoxId);
      if (selectedBox) {
        const hitAnchor = GeometryUtils.getHitAnchor(imgPt, selectedBox.points, 10 / zoom);
        if (hitAnchor >= 0) {
          setActiveAnchorIndex(hitAnchor);
          setIsDraggingAnchor(true);
          return;
        }
      }
    }

    // 2. Check if a bounding box body was hit
    const hitBox = visibleBoxes.slice().reverse().find(b => GeometryUtils.isPointInPolygon(imgPt, b.points));

    if (hitBox) {
      setSelectedBoxId(hitBox.id);
      setSelectedSentenceId(hitBox.sentence_id);
      setIsDraggingBox(true);
    } else {
      setSelectedBoxId(null);
      setSelectedSentenceId(null);
    }
  };

  // Handle Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const imgPt = GeometryUtils.canvasToImage([clientX, clientY], zoom, panX, panY);

    if (isPanning) {
      const deltaX = clientX - lastMousePos[0];
      const deltaY = clientY - lastMousePos[1];
      onUpdateTransform(zoom, panX + deltaX, panY + deltaY);
      setLastMousePos([clientX, clientY]);
      return;
    }

    if (isDraggingAnchor && selectedBoxId && activeAnchorIndex >= 0) {
      moveBoxVertex(selectedBoxId, activeAnchorIndex, imgPt);
      return;
    }

    if (isDraggingBox && selectedBoxId) {
      const deltaX = (clientX - lastMousePos[0]) / zoom;
      const deltaY = (clientY - lastMousePos[1]) / zoom;
      translateBox(selectedBoxId, deltaX, deltaY);
      setLastMousePos([clientX, clientY]);
      return;
    }

    // Hover detection
    const hitBox = visibleBoxes.slice().reverse().find(b => GeometryUtils.isPointInPolygon(imgPt, b.points));
    setHoveredBoxId(hitBox ? hitBox.id : null);
  };

  // Handle Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingAnchor(false);
    setIsDraggingBox(false);
    setActiveAnchorIndex(-1);
  };

  // Double click box to inspect / edit text
  const handleDoubleClick = () => {
    if (selectedBoxId) {
      onOpenEditModal();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-slate-900/90 overflow-hidden flex items-center justify-center ${
        isPanning || spacePressed || isPanMode ? 'canvas-pan' : 'canvas-interactive'
      }`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
