import { Draw } from "@/components/Draw";
import { LineSegment, ProgramRunner } from "@/language/program_runner";
import { parser } from "@/language/parser";
import { Program } from "@/language/program";
import styles from "@/styles/Home.module.css";
import CodeMirror from '@uiw/react-codemirror';
import { useState } from "react";
import { javascript } from '@codemirror/lang-javascript';
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

  function reset() {
    setLines([]);
  }

  async function runScript() {
    console.log(script);
    try {
      const program = parser.parse(script) as Program;
      const runner = new ProgramRunner();
      const buffer: LineSegment[] = [];
      runner.run(program, (line) => {
        buffer.push(line);
      });
      for (const line of buffer) {
        setLines((lines) => [...lines, line]);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } catch (e) {
      console.error('Error running script:', e);
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
          />
        </div>
      </div>
    </main>
  );
}
