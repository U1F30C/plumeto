import { LineSegment } from "./language/program_runner";

// how drawing coordinates map to the screen: screen = drawing * scale + (x, y)
export interface View {
  scale: number;
  x: number;
  y: number;
}

// the part of the canvas the drawing can use, in screen pixels
export interface Area {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const MIN_SCALE = 0.01;
export const MAX_SCALE = 100;

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function toScreen(view: View, x: number, y: number) {
  return { x: x * view.scale + view.x, y: y * view.scale + view.y };
}

// the drawing origin in the middle of the area, at actual size
export function centeredView(area: Area): View {
  return { scale: 1, x: area.left + area.width / 2, y: area.top + area.height / 2 };
}

export function fitView(
  lines: LineSegment[],
  area: Area,
  { padding = 32, maxScale = MAX_SCALE } = {}
): View {
  if (lines.length === 0) return centeredView(area);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x1, y1, x2, y2] of lines) {
    minX = Math.min(minX, x1, x2);
    maxX = Math.max(maxX, x1, x2);
    minY = Math.min(minY, y1, y2);
    maxY = Math.max(maxY, y1, y2);
  }

  // a drawing with no width or height only limits the scale along the other side
  const width = maxX - minX;
  const height = maxY - minY;
  const scaleX = width > 0 ? (area.width - 2 * padding) / width : Infinity;
  const scaleY = height > 0 ? (area.height - 2 * padding) / height : Infinity;
  let scale = Math.min(scaleX, scaleY, maxScale);
  scale = clampScale(Number.isFinite(scale) ? scale : 1);

  return {
    scale,
    x: area.left + area.width / 2 - ((minX + maxX) / 2) * scale,
    y: area.top + area.height / 2 - ((minY + maxY) / 2) * scale,
  };
}

// zoom by factor while keeping the screen point (px, py) over the same spot of the drawing
export function zoomAt(view: View, factor: number, px: number, py: number): View {
  const scale = clampScale(view.scale * factor);
  const ratio = scale / view.scale;
  return {
    scale,
    x: px - (px - view.x) * ratio,
    y: py - (py - view.y) * ratio,
  };
}
