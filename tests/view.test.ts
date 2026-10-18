import { describe, expect, it } from "vitest";
import {
  Area,
  MAX_SCALE,
  MIN_SCALE,
  View,
  centeredView,
  fitView,
  toScreen,
  zoomAt,
} from "../src/view";
import { LineSegment } from "../src/language/program_runner";

const area: Area = { left: 200, top: 0, width: 400, height: 300 };
const center = { x: 400, y: 150 };

function screenBounds(view: View, lines: LineSegment[]) {
  const points = lines.flatMap(([x1, y1, x2, y2]) => [toScreen(view, x1, y1), toScreen(view, x2, y2)]);
  return {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}

describe("centeredView", () => {
  it("puts the drawing origin in the middle of the area at actual size", () => {
    const view = centeredView(area);
    expect(view.scale).toBe(1);
    expect(toScreen(view, 0, 0)).toEqual(center);
  });
});

describe("fitView", () => {
  it("centers the drawing in the area", () => {
    const lines: LineSegment[] = [[0, 0, 100, 50]];
    const box = screenBounds(fitView(lines, area, { padding: 0 }), lines);
    expect((box.minX + box.maxX) / 2).toBeCloseTo(center.x);
    expect((box.minY + box.maxY) / 2).toBeCloseTo(center.y);
  });

  it("fills the area along the tighter dimension", () => {
    const lines: LineSegment[] = [[0, 0, 100, 50]];
    expect(fitView(lines, area, { padding: 0 }).scale).toBeCloseTo(4);
  });

  it("keeps the padding free", () => {
    const lines: LineSegment[] = [[-500, -500, 5000, 2000]];
    const box = screenBounds(fitView(lines, area, { padding: 20 }), lines);
    expect(box.minX).toBeGreaterThanOrEqual(area.left + 20 - 1e-9);
    expect(box.maxX).toBeLessThanOrEqual(area.left + area.width - 20 + 1e-9);
    expect(box.minY).toBeGreaterThanOrEqual(area.top + 20 - 1e-9);
    expect(box.maxY).toBeLessThanOrEqual(area.top + area.height - 20 + 1e-9);
  });

  it("shrinks drawings bigger than the area", () => {
    const lines: LineSegment[] = [[0, 0, 10000, 0]];
    expect(fitView(lines, area, { padding: 0 }).scale).toBeCloseTo(0.04);
  });

  it("can be kept from enlarging small drawings", () => {
    const lines: LineSegment[] = [[0, 0, 10, 10]];
    expect(fitView(lines, area, { maxScale: 1 }).scale).toBe(1);
  });

  it("handles drawings with no width or height", () => {
    const view = fitView([[5, 5, 5, 5]], area);
    expect(Number.isFinite(view.scale)).toBe(true);
    expect(toScreen(view, 5, 5).x).toBeCloseTo(center.x);
    expect(toScreen(view, 5, 5).y).toBeCloseTo(center.y);
  });

  it("falls back to the centered view without lines", () => {
    expect(fitView([], area)).toEqual(centeredView(area));
  });
});

describe("zoomAt", () => {
  const view: View = { scale: 2, x: 100, y: 50 };

  it("keeps the point under the cursor in place", () => {
    const zoomed = zoomAt(view, 1.5, 300, 200);
    // the drawing point that was under the cursor
    const drawingX = (300 - view.x) / view.scale;
    const drawingY = (200 - view.y) / view.scale;
    expect(toScreen(zoomed, drawingX, drawingY).x).toBeCloseTo(300);
    expect(toScreen(zoomed, drawingX, drawingY).y).toBeCloseTo(200);
    expect(zoomed.scale).toBeCloseTo(3);
  });

  it("stays within the scale limits", () => {
    expect(zoomAt(view, 1e9, 0, 0).scale).toBe(MAX_SCALE);
    expect(zoomAt(view, 1e-9, 0, 0).scale).toBe(MIN_SCALE);
  });
});
