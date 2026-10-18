import { Draw } from "@/components/Draw";
import { LineSegment } from "@/language/program_runner";
import { execute } from "@/language/execute";
import { PlumetoError } from "@/language/errors";
import styles from "@/styles/Home.module.css";
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { useEffect, useMemo, useRef, useState } from "react";
import { Diagnostic, setDiagnostics } from '@codemirror/lint';
import { ExampleFile, examples } from "@/examples";
import { ExampleMenu } from "@/components/ExampleMenu";
import { editorExtensions, editorTheme } from "@/editor";
import { useTheme } from "@/theme";
import { loadSavedScript, saveScript } from "@/storage";
import { decodeScript, encodeScript } from "@/share";

const defaultExample = examples.find((example) => example.fileName === "cloud.plm") ?? examples[0];

// lines drawn per animation frame
const speeds = {
  Slow: 1,
  Normal: 5,
  Fast: 50,
  Instant: Infinity,
};
type Speed = keyof typeof speeds;

export default function App() {
  // restore what was in the editor last time, otherwise start with the default example
  const [initial] = useState(() => loadSavedScript() ?? { loaded: defaultExample, script: defaultExample.fileContents });
  const [loadedExample, setLoadedExample] = useState<ExampleFile>(initial.loaded);
  const [script, setScript] = useState(initial.script);
  const modified = script !== loadedExample.fileContents;
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [editorOpen, setEditorOpen] = useState(true);

  const [lines, setLines] = useState<LineSegment[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [speed, setSpeed] = useState<Speed>("Normal");
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState<PlumetoError | null>(null);
  const { theme, toggleTheme } = useTheme();
  const editorRef = useRef<EditorView | null>(null);
  const frameRef = useRef<number | null>(null);
  // read inside the animation loop, so changing speed mid-drawing takes effect right away
  const speedRef = useRef(speed);
  speedRef.current = speed;

  function stopAnimation() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setAnimating(false);
  }

  useEffect(() => stopAnimation, []);

  // the drawing is centered in the space right of the editor panel, so track where the panel ends
  const panelRef = useRef<HTMLElement>(null);
  const [panelRight, setPanelRight] = useState(0);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const observer = new ResizeObserver(() => setPanelRight(panel.offsetLeft + panel.offsetWidth));
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  function animate(total: number) {
    stopAnimation();
    let count = 0;
    const step = () => {
      count = Math.min(count + speeds[speedRef.current], total);
      setVisibleCount(count);
      frameRef.current = count < total ? requestAnimationFrame(step) : null;
      if (frameRef.current === null) setAnimating(false);
    };
    setAnimating(true);
    frameRef.current = requestAnimationFrame(step);
  }

  function clear() {
    stopAnimation();
    setLines([]);
    setVisibleCount(0);
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

  useEffect(() => {
    saveScript({ loaded: loadedExample, script });
  }, [loadedExample, script]);

  // a shared link carries its script in the URL: load it, run it, then drop it from the
  // address bar so a reload doesn't throw away edits made since
  const sharedLinkHandled = useRef(false);
  useEffect(() => {
    if (sharedLinkHandled.current) return;
    sharedLinkHandled.current = true;
    const encoded = new URLSearchParams(location.hash.slice(1)).get("code");
    if (encoded === null) return;
    history.replaceState(null, "", location.pathname + location.search);
    decodeScript(encoded).then((shared) => {
      if (shared === null) {
        alert("This shared link is damaged, so its script couldn't be loaded.");
        return;
      }
      if (modified && !confirm(`Replace your changes to ${loadedExample.fileName} with the shared script?`)) return;
      setLoadedExample({ fileName: "shared.plm", fileContents: shared });
      setScript(shared);
      runScript(shared);
    });
  }, []);

  async function share() {
    const url = `${location.origin}${location.pathname}#code=${await encodeScript(script)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      // the clipboard can be unavailable (permissions, insecure origin); let them copy it by hand
      prompt("Copy this link to share your script:", url);
    }
  }

  function loadExample(example: ExampleFile) {
    if (modified && !confirm(`Discard your changes to ${loadedExample.fileName}?`)) return;
    setLoadedExample(example);
    setScript(example.fileContents);
    showError(null);
  }

  // the editor's keymap is created once, so it calls whatever runScript is current
  const runRef = useRef(runScript);
  runRef.current = runScript;
  const extensions = useMemo(() => editorExtensions(() => runRef.current()), []);

  function runScript(source = script) {
    const buffer: LineSegment[] = [];
    try {
      execute(source, (line) => {
        buffer.push(line);
      });
      showError(null);
    } catch (e) {
      // lines drawn before a runtime error are still shown, which helps to see how far it got
      showError(e instanceof PlumetoError ? e : new PlumetoError(String(e), "runtime"));
    }
    setLines(buffer);
    setVisibleCount(0);
    animate(buffer.length);
  }

  return (
    <div className={styles.app}>
      <header className={styles.bar}>
        <h1 className={styles.title}>Plumeto</h1>

        <button onClick={() => runScript()} className={`${styles.button} ${styles.primary}`} title="Run the script, starts a fresh drawing (Ctrl+Enter)">
          ▶ Run
        </button>
        <button onClick={stopAnimation} disabled={!animating} className={styles.button} title="Stop drawing, keep what's drawn so far">
          ■ Stop
        </button>
        <button onClick={clear} className={styles.button} title="Stop and clear the canvas">
          ✕ Clear
        </button>
        <label className={styles.speed}>
          Speed
          <select className={styles.select} value={speed} onChange={(e) => setSpeed(e.target.value as Speed)}>
            {Object.keys(speeds).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <button
          onClick={share}
          className={styles.iconButton}
          aria-label={shareStatus === "copied" ? "Link copied" : "Share: copy a link that opens this script"}
          title={shareStatus === "copied" ? "Link copied" : "Share: copy a link that opens this script"}
        >
          {shareStatus === "copied" ? "✓" : "⇪"}
        </button>
        <button
          onClick={toggleTheme}
          className={styles.iconButton}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <a className={styles.iconButton} href="https://github.com/U1F30C/plumeto" aria-label="Plumeto on GitHub" title="Plumeto on GitHub">
          <span className={styles.githubIcon} />
        </a>
      </header>

      <main className={styles.stage}>
        <Draw className={styles.canvas} lines={lines} count={visibleCount} theme={theme} left={panelRight} />

        {!editorOpen && (
          <button className={`${styles.button} ${styles.showEditor}`} onClick={() => setEditorOpen(true)} title="Show the editor">
            » Code
          </button>
        )}

        <section className={styles.panel} ref={panelRef} hidden={!editorOpen} aria-label="Script editor">
          <div className={styles.panelHeader}>
            <ExampleMenu
              examples={examples}
              currentName={loadedExample.fileName}
              modified={modified}
              onSelect={loadExample}
            />
            <button className={styles.collapse} onClick={() => setEditorOpen(false)} title="Hide the editor" aria-label="Hide the editor">
              «
            </button>
          </div>
          <CodeMirror
            className={styles.editor}
            value={script}
            onChange={setScript}
            extensions={extensions}
            theme={editorTheme}
            height="100%"
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
        </section>
      </main>
    </div>
  );
}
