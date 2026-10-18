import { Draw } from "@/components/Draw";
import { LineSegment } from "@/language/program_runner";
import { execute } from "@/language/execute";
import { PlumetoError } from "@/language/errors";
import styles from "@/styles/Home.module.css";
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { useRef, useState } from "react";
import { javascript } from '@codemirror/lang-javascript';
import { Diagnostic, setDiagnostics } from '@codemirror/lint';
import { examples } from "@/examples";

const editorExtensions = [javascript({ jsx: true })]

export default function App() {
  const [script, setScript] = useState(`for x in 1..12 {
    for y in 1..60 {
      rotate y deg
      forward 5
    }
  }
  `);

  const [lines, setLines] = useState<LineSegment[]>([]);
  const [error, setError] = useState<PlumetoError | null>(null);
  const editorRef = useRef<EditorView | null>(null);

  function reset() {
    setLines([]);
  }

  function showError(error: PlumetoError | null) {
    setError(error);
    const view = editorRef.current;
    if (!view) return;
    const diagnostics: Diagnostic[] = [];
    if (error?.location) {
      const length = view.state.doc.length;
      diagnostics.push({
        from: Math.min(error.location.start.offset, length),
        to: Math.min(error.location.end.offset, length),
        severity: "error",
        message: error.message,
      });
    }
    view.dispatch(setDiagnostics(view.state, diagnostics));
  }

  function goToError() {
    const view = editorRef.current;
    if (!view || !error?.location) return;
    view.dispatch({
      selection: { anchor: Math.min(error.location.start.offset, view.state.doc.length) },
      scrollIntoView: true,
    });
    view.focus();
  }

  async function runScript() {
    const buffer: LineSegment[] = [];
    try {
      execute(script, (line) => {
        buffer.push(line);
      });
      showError(null);
    } catch (e) {
      // lines drawn before a runtime error are still shown, which helps to see how far it got
      showError(e instanceof PlumetoError ? e : new PlumetoError(String(e), "runtime"));
    }
    for (const line of buffer) {
      setLines((lines) => [...lines, line]);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          <a href="https://github.com/U1F30C/plumeto">
            <code className={styles.code}>
              <img src="/github.svg" width="32px" />
              Plumeto
            </code>
          </a>
        </p>
      </div>

      <div className={styles.center}>
        <Draw lines={lines}/>
        <div>
          <button onClick={runScript} className={styles.button}>
            Run
          </button>
          <button onClick={reset} className={styles.button}>
            Reset
          </button>

          <select onChange={(e) => setScript(e.target.value)}>
            {examples.map((example) => (
              <option key={example.fileName} value={example.fileContents}>
                {example.fileName}
              </option>
            ))}
          </select>
          <CodeMirror
            className={styles.codeBox}
            value={script}
            onChange={setScript}
            extensions={editorExtensions}
            onCreateEditor={(view) => {
              editorRef.current = view;
            }}
          />
          {error && (
            <p className={styles.error} role="alert" onClick={goToError}>
              <strong>{error.kind === "syntax" ? "Syntax error" : "Runtime error"}</strong>
              {error.location && ` on line ${error.location.start.line}, column ${error.location.start.column}`}
              : {error.message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
