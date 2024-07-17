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
              <img src="/github.svg" width="32px" />
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
