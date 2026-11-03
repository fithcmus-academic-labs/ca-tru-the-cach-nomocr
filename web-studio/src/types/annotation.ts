export type Point2D = [number, number]; // [x, y]
export type Polygon4Points = [Point2D, Point2D, Point2D, Point2D]; // Strictly 4 points

export type RegionType = 'ch' | 'vi';
export type MatchStatus = 'matched' | 'mismatched' | 'unverified';

export interface BoundingBox {
  id: string; // Unique ID (e.g. "box_ch_006_0")
  img_id: string; // e.g. "Ca Trù Thê Cách, AB 160, Nôm_Y.006.jpg"
  sentence_id: string; // e.g. "Ca Trù Thê Cách, AB 160, Nôm_Y.006.1"
  region_type: RegionType;
  transcription: string;
  points: Polygon4Points;
  confidence?: number;
  status: MatchStatus;
  isModified?: boolean;
}

export interface CanvasViewport {
  zoom: number; // 0.2 to 5.0
  panX: number;
  panY: number;
  containerWidth: number;
  containerHeight: number;
}
