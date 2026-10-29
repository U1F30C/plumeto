import { execute } from "@/language/execute";
import { LineSegment } from "@/language/program_runner";

// runs example scripts off the main thread, because some take seconds and the
// gallery has to stay responsive while its thumbnails fill in
const worker = self as unknown as {
  onmessage: (event: MessageEvent<{ id: number; source: string }>) => void;
  postMessage: (message: { id: number; lines: LineSegment[] }) => void;
};

worker.onmessage = ({ data }) => {
  const lines: LineSegment[] = [];
  try {
    execute(data.source, (line) => {
      lines.push(line);
    });
  } catch {
    // a script that fails still shows whatever it drew before the error
  }
  worker.postMessage({ id: data.id, lines });
};
