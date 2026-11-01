import { describe, it, expect } from 'vitest';
import { GeometryUtils } from '../utils/geometry';
import { Polygon4Points } from '../types/annotation';

describe('GeometryUtils', () => {
  const box: Polygon4Points = [
    [100, 100],
    [300, 100],
    [300, 200],
    [100, 200]
  ];

  it('detects point inside polygon correctly', () => {
    expect(GeometryUtils.isPointInPolygon([150, 150], box)).toBe(true);
    expect(GeometryUtils.isPointInPolygon([50, 50], box)).toBe(false);
    expect(GeometryUtils.isPointInPolygon([400, 150], box)).toBe(false);
  });

  it('identifies vertex anchor index on click', () => {
    expect(GeometryUtils.getHitAnchor([102, 101], box, 8)).toBe(0);
    expect(GeometryUtils.getHitAnchor([299, 102], box, 8)).toBe(1);
    expect(GeometryUtils.getHitAnchor([298, 198], box, 8)).toBe(2);
    expect(GeometryUtils.getHitAnchor([101, 201], box, 8)).toBe(3);
    expect(GeometryUtils.getHitAnchor([200, 150], box, 8)).toBe(-1);
  });

  it('transforms between image and canvas coordinates accurately', () => {
    const zoom = 2.0;
    const panX = 50;
    const panY = 100;

    const imgPt: [number, number] = [200, 300];
    const canvasPt = GeometryUtils.imageToCanvas(imgPt, zoom, panX, panY);

    expect(canvasPt).toEqual([200 * 2 + 50, 300 * 2 + 100]);

    const invertedPt = GeometryUtils.canvasToImage(canvasPt, zoom, panX, panY);
    expect(invertedPt).toEqual(imgPt);
  });
});
