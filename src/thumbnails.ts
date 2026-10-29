import { LineSegment } from "@/language/program_runner";
import type { ExampleFile } from "@/examples";

// The drawings of the examples, which the gallery shows as thumbnails. They are run one at a
// time in a worker, only for the examples someone is looking at, and kept for the rest of the
// session. A random example gets a new drawing on each page load, not on each opening.

interface Job {
  example: ExampleFile;
  // false once nobody wants it any more, so it is skipped if it hasn't started yet
  wanted: boolean;
  finished: boolean;
  resolve: (lines: LineSegment[]) => void;
}

const cache = new Map<string, Promise<LineSegment[]>>();
const queue: Job[] = [];
let worker: Worker | null = null;
let running: Job | null = null;

function start() {
  if (running) return;
  const job = queue.find((job) => job.wanted);
  if (!job) {
    queue.length = 0;
    return;
  }
  queue.splice(0, queue.indexOf(job) + 1);
  running = job;
  worker ??= new Worker(new URL("./thumbnail.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = ({ data }) => {
    running = null;
    job.finished = true;
    job.resolve(data.lines);
    start();
  };
  worker.postMessage({ id: 0, source: job.example.fileContents });
}

// Asks for an example's drawing. Calling the returned function says it is no longer needed,
// which only matters if it hasn't been started: a drawing that is already running finishes.
export function requestDrawing(example: ExampleFile): { drawing: Promise<LineSegment[]>; cancel: () => void } {
  let job: Job | undefined;
  let drawing = cache.get(example.fileName);
  if (!drawing) {
    drawing = new Promise<LineSegment[]>((resolve) => {
      job = { example, wanted: true, finished: false, resolve };
    });
    cache.set(example.fileName, drawing);
    queue.push(job!);
    start();
  }
  return {
    drawing,
    cancel: () => {
      if (job && !job.finished && job !== running) {
        job.wanted = false;
        // forget it, so asking again later queues it again
        cache.delete(example.fileName);
      }
    },
  };
}
