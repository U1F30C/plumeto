#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import { resolve, basename, extname } from 'path'
import { ProgramRunner, LineSegment } from '../src/language/program_runner.js'
import { parser } from '../src/language/parser.js'
import { Program } from '../src/language/program.js'

const SIZE = 500
const CENTER = SIZE / 2
const STROKE = 'gray'
const STROKE_WIDTH = 2

const PAD = 8

function toSvg(lines: LineSegment[]): string {
  const xs = lines.flatMap(([x1, , x2]) => [x1, x2])
  const ys = lines.flatMap(([, y1, , y2]) => [y1, y2])
  const minX = Math.min(...xs) - PAD
  const minY = Math.min(...ys) - PAD
  const maxX = Math.max(...xs) + PAD
  const maxY = Math.max(...ys) + PAD
  const w = maxX - minX
  const h = maxY - minY

  const lineElements = lines.map(([x1, y1, x2, y2]) =>
    `  <line x1="${x1 - minX}" y1="${y1 - minY}" x2="${x2 - minX}" y2="${y2 - minY}" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}"/>`
  ).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${lineElements}
</svg>`
}

function parseArgs(argv: string[]): { input: string; output: string } {
  const args = argv.slice(2)
  const inputIndex = args.findIndex(a => !a.startsWith('-'))
  if (inputIndex === -1) {
    console.error('Usage: plumeto <input.plm> [-o output.svg]')
    process.exit(1)
  }
  const input = args[inputIndex]
  const oFlag = args.indexOf('-o')
  const output = oFlag !== -1 && args[oFlag + 1]
    ? args[oFlag + 1]
    : basename(input, extname(input)) + '.svg'
  return { input, output }
}

const { input, output } = parseArgs(process.argv)

let source: string
try {
  source = readFileSync(resolve(input), 'utf8')
} catch {
  console.error(`Error: file not found: ${input}`)
  process.exit(1)
}

let program: Program
try {
  program = parser.parse(source) as Program
} catch (e) {
  console.error('Parse error:', (e as Error).message)
  process.exit(1)
}

const lines: LineSegment[] = []
const runner = new ProgramRunner()
try {
  runner.run(program, (line) => lines.push(line))
} catch (e) {
  console.error('Runtime error:', (e as Error).message)
  process.exit(1)
}

const outPath = resolve(output)
writeFileSync(outPath, toSvg(lines), 'utf8')
console.log(`${lines.length} segments → ${outPath}`)
