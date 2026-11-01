import { create } from 'zustand';
import { BoundingBox, Point2D, Polygon4Points, RegionType } from '../types/annotation';
import { apiAdapter } from '../services/apiAdapter';
import { GeometryUtils } from '../utils/geometry';

interface AnnotationState {
  boxes: BoundingBox[];
  selectedBoxId: string | null;
  hoveredBoxId: string | null;
  activeAnchorIndex: number; // 0..3 or -1
  visibleRegion: 'all' | 'ch' | 'vi';
  isDrawingMode: boolean;
  drawingPoints: Point2D[];

  setBoxes: (boxes: BoundingBox[]) => void;
  setSelectedBoxId: (id: string | null) => void;
  setHoveredBoxId: (id: string | null) => void;
  setActiveAnchorIndex: (index: number) => void;
  setVisibleRegion: (region: 'all' | 'ch' | 'vi') => void;
  setIsDrawingMode: (active: boolean) => void;
  
  loadBoxesForPage: (projectId: string, pageNumber: number) => Promise<void>;
  updateBoxPoints: (boxId: string, newPoints: Polygon4Points) => void;
  moveBoxVertex: (boxId: string, anchorIndex: number, newPoint: Point2D) => void;
  translateBox: (boxId: string, deltaX: number, deltaY: number) => void;
  addBox: (newBox: BoundingBox) => void;
  deleteBox: (boxId: string) => void;
  getSelectedBox: () => BoundingBox | undefined;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  boxes: [],
  selectedBoxId: null,
  hoveredBoxId: null,
  activeAnchorIndex: -1,
  visibleRegion: 'all',
  isDrawingMode: false,
  drawingPoints: [],

  setBoxes: (boxes) => set({ boxes }),
  setSelectedBoxId: (id) => set({ selectedBoxId: id }),
  setHoveredBoxId: (id) => set({ hoveredBoxId: id }),
  setActiveAnchorIndex: (index) => set({ activeAnchorIndex: index }),
  setVisibleRegion: (region) => set({ visibleRegion: region }),
  setIsDrawingMode: (active) => set({ isDrawingMode: active, drawingPoints: [] }),

  loadBoxesForPage: async (projectId, pageNumber) => {
    try {
      const boxes = await apiAdapter.getAnnotations(projectId, pageNumber);
      set({ boxes, selectedBoxId: null, hoveredBoxId: null });
    } catch (e) {
      console.warn('Failed loading annotations', e);
    }
  },

  updateBoxPoints: (boxId, newPoints) =>
    set((state) => ({
      boxes: state.boxes.map((b) => (b.id === boxId ? { ...b, points: newPoints, isModified: true } : b))
    })),

  moveBoxVertex: (boxId, anchorIndex, newPoint) =>
    set((state) => ({
      boxes: state.boxes.map((b) => {
        if (b.id !== boxId) return b;
        const pts: Polygon4Points = [...b.points] as Polygon4Points;
        pts[anchorIndex] = [Math.round(newPoint[0]), Math.round(newPoint[1])];
        return { ...b, points: pts, isModified: true };
      })
    })),

  translateBox: (boxId, deltaX, deltaY) =>
    set((state) => ({
      boxes: state.boxes.map((b) => {
        if (b.id !== boxId) return b;
        const pts: Polygon4Points = b.points.map(([x, y]) => [
          Math.round(x + deltaX),
          Math.round(y + deltaY)
        ]) as Polygon4Points;
        return { ...b, points: pts, isModified: true };
      })
    })),

  addBox: (newBox) =>
    set((state) => ({
      boxes: [...state.boxes, newBox],
      selectedBoxId: newBox.id,
      isDrawingMode: false,
      drawingPoints: []
    })),

  deleteBox: (boxId) =>
    set((state) => ({
      boxes: state.boxes.filter((b) => b.id !== boxId),
      selectedBoxId: state.selectedBoxId === boxId ? null : state.selectedBoxId
    })),

  getSelectedBox: () => {
    const { boxes, selectedBoxId } = get();
    return boxes.find((b) => b.id === selectedBoxId);
  }
}));
