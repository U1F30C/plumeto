import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import rough from 'roughjs';
import type { RoughGenerator } from 'roughjs/bin/generator';
import { LineSegment } from '../language/program_runner';
import type { Theme } from '../theme';
import { Area, View, fitView, zoomAt } from '../view';
import styles from '@/styles/Home.module.css';

interface DrawProps {
  lines: LineSegment[];
  // how many of the lines to show, so the drawing can be animated
  count: number;
  // only used to know when to redraw; the ink color is read from the --ink CSS variable
  theme: Theme;
  // canvas space covered on the left (by the editor panel); the drawing uses what's left
  left?: number;
  className?: string;
}

interface Size {
  width: number;
  height: number;
  pixelRatio: number;
}

type Point = { x: number; y: number };

const ZOOM_STEP = 1.25;

// a line's sketchy wobble is generated once, with a fixed seed, so redrawing while
// panning or zooming doesn't make it jitter
function roughPath(generator: RoughGenerator, [x1, y1, x2, y2]: LineSegment, index: number) {
  const path = new Path2D();
  for (const info of generator.toPaths(generator.line(x1, y1, x2, y2, { seed: index + 1 }))) {
    path.addPath(new Path2D(info.d));
  }
  return path;
}

export function Draw(props: DrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generator = useMemo(() => rough.generator(), []);
  const pathsRef = useRef<{ lines: LineSegment[]; paths: Path2D[] }>({ lines: [], paths: [] });
  const [size, setSize] = useState<Size>({ width: 0, height: 0, pixelRatio: 1 });
  const [view, setView] = useState<View | null>(null);

  const area: Area = useMemo(() => {
    const left = Math.min(props.left ?? 0, size.width);
    return { left, top: 0, width: size.width - left, height: size.height };
  }, [props.left, size.width, size.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height, pixelRatio: window.devicePixelRatio || 1 });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // when the visible area moves or resizes (window resize, editor shown or hidden),
  // keep whatever was in its middle in the middle
  const areaRef = useRef<Area | null>(null);
  useEffect(() => {
    const previous = areaRef.current;
    areaRef.current = area;
    if (!previous) return;
    const dx = area.left + area.width / 2 - (previous.left + previous.width / 2);
    const dy = area.top + area.height / 2 - (previous.top + previous.height / 2);
    if (dx !== 0 || dy !== 0) setView((view) => view && { ...view, x: view.x + dx, y: view.y + dy });
  }, [area]);

  // every new drawing (Run or Clear) is fitted into view, without enlarging small drawings
  const ready = size.width > 0;
  useEffect(() => {
    if (ready) setView(fitView(props.lines, area, { maxScale: 1 }));
  }, [props.lines, ready]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // render at the screen's real pixel density so lines stay sharp on high-res screens
    const width = Math.round(size.width * size.pixelRatio);
    const height = Math.round(size.height * size.pixelRatio);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const context = canvas.getContext('2d')!;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!view) return;

    let cache = pathsRef.current;
    if (cache.lines !== props.lines) cache = pathsRef.current = { lines: props.lines, paths: [] };
    for (let i = cache.paths.length; i < props.count; i++) {
      cache.paths.push(roughPath(generator, props.lines[i], i));
    }

    const ratio = size.pixelRatio;
    context.setTransform(ratio * view.scale, 0, 0, ratio * view.scale, ratio * view.x, ratio * view.y);
    context.strokeStyle = getComputedStyle(canvas).getPropertyValue('--ink').trim();
    // keep a constant on-screen line width at any zoom
    context.lineWidth = 1.5 / view.scale;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (let i = 0; i < props.count; i++) context.stroke(cache.paths[i]);
  }, [props.lines, props.count, props.theme, size, view, generator]);

  // ---------- panning and zooming ----------

  function canvasPoint(event: { clientX: number; clientY: number }): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // added by hand because React's wheel listener is passive and can't stop the page from scrolling
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const point = canvasPoint(event);
      const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY;
      // trackpad pinches arrive as wheel events with ctrlKey and small deltas
      const factor = Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0015));
      setView((view) => view && zoomAt(view, factor, point.x, point.y));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // one pointer drags the drawing, two pointers (fingers) pinch to zoom
  const pointers = useRef(new Map<number, Point>());

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, canvasPoint(event));
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    const before = [...pointers.current.values()];
    pointers.current.set(event.pointerId, canvasPoint(event));
    const after = [...pointers.current.values()];

    if (after.length === 1) {
      const dx = after[0].x - before[0].x;
      const dy = after[0].y - before[0].y;
      setView((view) => view && { ...view, x: view.x + dx, y: view.y + dy });
    } else if (after.length === 2) {
      const middle = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const middleBefore = middle(before[0], before[1]);
      const middleAfter = middle(after[0], after[1]);
      const factor = distance(after[0], after[1]) / distance(before[0], before[1]);
      setView((view) => {
        if (!view) return view;
        const zoomed = zoomAt(view, factor, middleBefore.x, middleBefore.y);
        return { ...zoomed, x: zoomed.x + middleAfter.x - middleBefore.x, y: zoomed.y + middleAfter.y - middleBefore.y };
      });
    }
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId);
  }

  function zoomFromCenter(factor: number) {
    const x = area.left + area.width / 2;
    const y = area.top + area.height / 2;
    setView((view) => view && zoomAt(view, factor, x, y));
  }

  return (
    <div className={props.className}>
      <canvas
        className={styles.drawingCanvas}
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className={styles.zoomControls}>
        <button className={styles.iconButton} onClick={() => setView(fitView(props.lines, area))} title="Fit the drawing to the view" aria-label="Fit the drawing to the view">
          ⤢
        </button>
        <button className={styles.iconButton} onClick={() => zoomFromCenter(ZOOM_STEP)} title="Zoom in" aria-label="Zoom in">
          +
        </button>
        <button className={styles.iconButton} onClick={() => zoomFromCenter(1 / ZOOM_STEP)} title="Zoom out" aria-label="Zoom out">
          −
        </button>
      </div>
    </div>
  );
}
