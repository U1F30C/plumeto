import { Draw } from "@/components/Draw";
import { LineSegment, ProgramRunner } from "@/language/program_runner";
import { parser } from "@/language/parser";
import { Program } from "@/language/program";
import styles from "@/styles/Home.module.css";
import CodeMirror from '@uiw/react-codemirror';
import { Inter } from "next/font/google";
import Head from "next/head";
import { useState } from "react";
import { javascript } from '@codemirror/lang-javascript';
import { InferGetStaticPropsType } from "next";

interface FileData {
  fileName: string;
  fileContents: string;
}

interface Props {
  filesData: FileData[];
}


export function getStaticProps(): { props: Props } {
  // list files under ../../examples
  const fs = require("fs");
  const path = require("path");
  const dir = path.join(process.cwd(), "examples");
  const files = fs.readdirSync(dir);

  // read the content of each file and put it in an object

  const filesData = files.map((file: string) => {
    const fileName = path.join(dir, file);
    const fileContents = fs.readFileSync(fileName, "utf8");
    return {
      fileName: file,
      fileContents,
    };
  });

  return {
    props: {
      filesData,
    },
  };
}
  

const inter = Inter({ subsets: ["latin"] });

export default function Home({
  filesData,
}: InferGetStaticPropsType<typeof getStaticProps>) {

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
    // canvas.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function runScript() {
    console.log(script);
    try {
      const program = parser.parse(script) as Program;
      const runner = new ProgramRunner();
      const buffer = [] as any[];
      runner.run(program, async (line) => {
        buffer.push(line);
      });
      for (const line of buffer) {
        setLines((lines) => [...lines, line]);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
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
            <code className={styles.code}>
              <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" data-view-component="true" class="octicon octicon-mark-github">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
              Plumeto
            </code>
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

            {/* // select listing of files */}
            <select onChange={(e) => setScript(e.target.value)}>
              {filesData && filesData.map((fileData) => (
                <option key={fileData.fileName} value={fileData.fileContents}>
                  {fileData.fileName}
                </option>
              ))}
            </select>
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
