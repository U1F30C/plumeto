import { parser } from "../src/language/parser";
import { Program } from "../src/language/program";
import { LineSegment, ProgramRunner } from "../src/language/program_runner";

export function parse(source: string): Program {
  return parser.parse(source) as Program;
}

export function run(source: string) {
  const runner = new ProgramRunner();
  const lines: LineSegment[] = [];
  runner.run(parse(source), (line) => lines.push(line));
  return { symbols: runner.ctx.symbols, lines };
}

export function evaluate(expression: string) {
  return run(`result = ${expression}`).symbols.result;
}

// deterministic stand-in for Math.random so stochastic examples are reproducible
export function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
