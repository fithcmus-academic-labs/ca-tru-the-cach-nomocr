import { Point2D, Polygon4Points } from '../types/annotation';

export class GeometryUtils {
  /**
   * Check if point (px, py) is inside a polygon using ray casting algorithm.
   */
  static isPointInPolygon(p: Point2D, polygon: Polygon4Points): boolean {
    const [px, py] = p;
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      const intersect =
        yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }

  /**
   * Find index of vertex anchor closest to cursor within radius.
   * Returns -1 if no anchor is within radius.
   */
  static getHitAnchor(
    cursor: Point2D,
    polygon: Polygon4Points,
    threshold: number = 8
  ): number {
    const [cx, cy] = cursor;
    for (let i = 0; i < polygon.length; i++) {
      const [vx, vy] = polygon[i];
      const dist = Math.hypot(cx - vx, cy - vy);
      if (dist <= threshold) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Bounding box of a polygon: [minX, minY, maxX, maxY]
   */
  static getPolygonBounds(polygon: Polygon4Points): [number, number, number, number] {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const [x, y] of polygon) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    return [minX, minY, maxX, maxY];
  }

  /**
   * Clamp point inside image dimensions
   */
  static clampPoint(p: Point2D, maxWidth: number, maxHeight: number): Point2D {
    return [
      Math.max(0, Math.min(Math.round(p[0]), maxWidth)),
      Math.max(0, Math.min(Math.round(p[1]), maxHeight))
    ];
  }

  /**
   * Translate image coordinate to canvas coordinate
   */
  static imageToCanvas(
    p: Point2D,
    zoom: number,
    panX: number,
    panY: number
  ): Point2D {
    return [p[0] * zoom + panX, p[1] * zoom + panY];
  }

  /**
   * Translate canvas coordinate to image coordinate
   */
  static canvasToImage(
    p: Point2D,
    zoom: number,
    panX: number,
    panY: number
  ): Point2D {
    return [(p[0] - panX) / zoom, (p[1] - panY) / zoom];
  }
}
