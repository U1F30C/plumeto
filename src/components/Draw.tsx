import { useEffect, useRef } from 'react';
import rough from 'roughjs';
import nj, {NdArray} from 'numjs';
import { LineSegment } from './program_runner';

const base = nj.array(nj.arange(0, 1000, 10));
const xAxis = nj.cos(base.divide(100)).multiply(100);
const yAxis = nj.sin(base.divide(100)).multiply(100);


const lineData = nj.stack([xAxis, yAxis], -1);

function centerLine(lineData: NdArray): [number, number][] {
    return lineData.add(250).tolist() as [number, number][];
}

interface DrawProps {
  lines: LineSegment[];
}

export function Draw(props: DrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log("useEffect", props.lines);
    if (canvasRef.current !== null) {
      const rc = rough.canvas(canvasRef.current!);
      const adjustedLines = nj.array(props.lines).add(250).tolist() as LineSegment[];
      for(const line of adjustedLines) {
        const lines = rc.line(...line);
        rc.draw(lines);
      }
      // const lines = rc.linearPath(
      //   centerLine(lineData),
      // );
    }
  }
    , [canvasRef, canvasRef.current, props.lines]);
  return <canvas id="canvas" width="500" height="500" ref={canvasRef} />;
}