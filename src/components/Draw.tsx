import { useEffect, useRef } from 'react';
import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import { LineSegment } from '../language/program_runner';

interface DrawProps {
  lines: LineSegment[];
}

export function Draw(props: DrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rcRef = useRef<RoughCanvas | null>(null);

  useEffect(() => {
    if (canvasRef.current === null) return;
    const canvas = canvasRef.current;
    if (props.lines.length === 0) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [props.lines]);

  useEffect(() => {
    if (canvasRef.current === null) return;
    if (!rcRef.current) rcRef.current = rough.canvas(canvasRef.current);
    const rc = rcRef.current;
    const canvas = canvasRef.current;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const last = props.lines.at(-1);
    if (last) {
      const [x1, y1, x2, y2] = last;
      rc.draw(rc.line(x1 + cx, y1 + cy, x2 + cx, y2 + cy, { stroke: 'gray', strokeWidth: 2 }));
    }
  }, [props.lines]);

  return <canvas id="canvas" width="500" height="500" ref={canvasRef} />;
}
