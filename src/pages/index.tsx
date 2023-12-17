import { Draw } from "@/components/Draw";
import { LineSegment, ProgramRunner } from "@/components/program_runner";
import { parser } from "@/language/parser";
import { Program } from "@/language/program";
import styles from "@/styles/Home.module.css";
import CodeMirror from '@uiw/react-codemirror';
import { Inter } from "next/font/google";
import Head from "next/head";
import { useState } from "react";
import { javascript } from '@codemirror/lang-javascript';


const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [script, setScript] = useState(`


  for y in 1..15 {
    rotate 90 deg
    forward y * 10
    for x in 0..5 {
      x = x
      forward 10 + x *5 + y * 5
      rotate 140 + y deg
    }
  }

  `);

  const [lines, setLines] = useState<LineSegment[]>([]);

  function reset() {
    setLines([]);
    // canvas.clearRect(0, 0, canvas.width, canvas.height);
  }

  function runScript() {
    console.log(script);
    try {
      const program = parser.parse(script) as Program;
      const runner = new ProgramRunner();
      runner.run(program, (line) => {
        setLines((lines) => [...lines, line]);
      });
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <>
      <Head>
        <title>Plumeto</title>
        <meta name="description" content="Drawing with code" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={styles.description}>
          <p>
            <code className={styles.code}>Plumeto</code>
          </p>
        </div>

        <div className={styles.center}>
          <Draw lines={lines}/>
          <div>
            <button onClick={runScript} className={styles.button}>
              Run
            </button>
            <CodeMirror
              className={styles.codeBox}
              value={script}
              onChange={(e) => setScript(e)}
              extensions={[javascript({ jsx: true })]}
        
            />

          </div>
        </div>
      </main>
    </>
  );
}
