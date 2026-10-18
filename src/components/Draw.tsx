import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import { LineSegment } from '../language/program_runner';
import type { Theme } from '../theme';

interface DrawProps {
  lines: LineSegment[];
  // how many of the lines to show, so the drawing can be animated
  count: number;
  // only used to know when to redraw; the ink color is read from the --ink CSS variable
  theme: Theme;
  // canvas space covered on the left (by the editor panel); the drawing is centered in what's left
  left?: number;
  className?: string;
}

interface Size {
  width: number;
  height: number;
  pixelRatio: number;
}

export function Draw(props: DrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rcRef = useRef<RoughCanvas | null>(null);
  const drawnRef = useRef<{ lines: LineSegment[]; count: number } | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0, pixelRatio: 1 });

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

  // a new size or theme means everything has to be drawn again
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // render at the screen's real pixel density so lines stay sharp on high-res screens
    canvas.width = Math.round(size.width * size.pixelRatio);
    canvas.height = Math.round(size.height * size.pixelRatio);
    drawnRef.current = null;
  }, [size, props.theme, props.left]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;
    if (!rcRef.current) rcRef.current = rough.canvas(canvas);
    const rc = rcRef.current;
    const context = canvas.getContext("2d")!;

    // only draw what's new since last time, unless it's a different drawing or it went backwards
    let drawn = drawnRef.current;
    if (!drawn || drawn.lines !== props.lines || drawn.count > props.count) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawn = { lines: props.lines, count: 0 };
    }

    context.setTransform(size.pixelRatio, 0, 0, size.pixelRatio, 0, 0);
    const ink = getComputedStyle(canvas).getPropertyValue("--ink").trim();
    const left = Math.min(props.left ?? 0, size.width);
    const cx = left + (size.width - left) / 2;
    const cy = size.height / 2;
    for (const [x1, y1, x2, y2] of props.lines.slice(drawn.count, props.count)) {
      rc.draw(rc.line(x1 + cx, y1 + cy, x2 + cx, y2 + cy, { stroke: ink, strokeWidth: 1.5 }));
    }
    drawnRef.current = { lines: props.lines, count: props.count };
  }, [props.lines, props.count, props.theme, props.left, size]);

  return <canvas className={props.className} ref={canvasRef} />;
}
