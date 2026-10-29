import { useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { ExampleFile } from "@/examples";
import { LineSegment } from "@/language/program_runner";
import { requestDrawing } from "@/thumbnails";
import type { Theme } from "@/theme";
import { fitView } from "@/view";
import styles from "@/styles/Home.module.css";

const SIZE = 240;
const generator = rough.generator();

// drawings with more lines than this are drawn plain: the pencil wobble can't be seen in a
// thumbnail, and generating it for thousands of lines would stall the page
const MAX_ROUGH_LINES = 3000;

// a small drawing of an example. It only runs the example once the thumbnail scrolls into view.
export function ExampleThumbnail(props: { example: ExampleFile; theme: Theme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seen, setSeen] = useState(false);
  const [lines, setLines] = useState<LineSegment[] | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    let current = true;
    const { drawing, cancel } = requestDrawing(props.example);
    drawing.then((lines) => current && setLines(lines));
    return () => {
      current = false;
      cancel();
    };
  }, [seen, props.example]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !lines) return;
    const context = canvas.getContext("2d")!;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, SIZE, SIZE);

    const view = fitView(lines, { left: 0, top: 0, width: SIZE, height: SIZE }, { padding: 18, maxScale: 1.5 });
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    const ink = getComputedStyle(canvas).getPropertyValue("--ink").trim();
    context.lineWidth = 2 / view.scale;
    context.lineCap = "round";
    context.lineJoin = "round";
    const sketchy = lines.length <= MAX_ROUGH_LINES;
    lines.forEach(([x1, y1, x2, y2, color], index) => {
      context.strokeStyle = color ?? ink;
      if (sketchy) {
        const path = new Path2D();
        for (const info of generator.toPaths(generator.line(x1, y1, x2, y2, { seed: index + 1 }))) {
          path.addPath(new Path2D(info.d));
        }
        context.stroke(path);
      } else {
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
      }
    });
  }, [lines, props.theme]);

  return <canvas ref={canvasRef} className={styles.thumbnail} width={SIZE} height={SIZE} aria-hidden="true" />;
}
