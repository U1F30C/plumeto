import { useEffect, useRef } from 'react';
import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import { LineSegment } from '../language/program_runner';

interface DrawProps {
  lines: LineSegment[];
  // how many of the lines to show, so the drawing can be animated
  count: number;
}

export function Draw(props: DrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rcRef = useRef<RoughCanvas | null>(null);
  const drawnRef = useRef<{ lines: LineSegment[]; count: number } | null>(null);

  useEffect(() => {
    if (canvasRef.current === null) return;
    if (!rcRef.current) rcRef.current = rough.canvas(canvasRef.current);
    const rc = rcRef.current;
    const canvas = canvasRef.current;

    // only draw what's new since last time, unless it's a different drawing or it went backwards
    let drawn = drawnRef.current;
    if (!drawn || drawn.lines !== props.lines || drawn.count > props.count) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      drawn = { lines: props.lines, count: 0 };
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (const [x1, y1, x2, y2] of props.lines.slice(drawn.count, props.count)) {
      rc.draw(rc.line(x1 + cx, y1 + cy, x2 + cx, y2 + cy, { stroke: 'gray', strokeWidth: 2 }));
    }
    drawnRef.current = { lines: props.lines, count: props.count };
  }, [props.lines, props.count]);

  return <canvas id="canvas" width="500" height="500" ref={canvasRef} />;
}
