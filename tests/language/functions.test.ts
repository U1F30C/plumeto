import { describe, expect, it } from "vitest";
import { run } from "../helpers";

describe("functions without parameters", () => {
  it("can be defined and called", () => {
    const { lines } = run(`
function square() {
  for i in 1..4 {
    forward 10
    rotate 90 deg
  }
}
square()
`);
    expect(lines).toHaveLength(4);
  });

  it("can return a value", () => {
    const { symbols } = run(`
function seven() {
  return 7
}
result = seven() + 1
`);
    expect(symbols.result).toBe(8);
  });

  it("allow whitespace between the parentheses", () => {
    const { lines } = run("function f( ) {\n  forward 1\n}\nf( )\nf(\n)");
    expect(lines).toHaveLength(2);
  });

  it("include native math functions", () => {
    const result = run("result = random()").symbols.result;
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1);
  });
});

describe("global variables written inside functions", () => {
  it("keep a write from a direct call", () => {
    expect(run("h = 0\nfunction set(a) { h = a }\nset(5)").symbols.h).toBe(5);
  });

  it("keep a write from a nested call", () => {
    const { symbols } = run(`
h = 0
function set(a) { h = a }
function outer(x) { set(x) }
outer(5)
`);
    expect(symbols.h).toBe(5);
  });

  it("keep writes made after a nested call returns", () => {
    const { symbols } = run(`
function noop() { }
function outer() { noop(); y = 2 }
outer()
`);
    expect(symbols.y).toBe(2);
  });

  it("let the caller see the write right away", () => {
    const { symbols } = run(`
h = 0
function set(a) { h = a }
function outer(x) { set(x); seen = h }
outer(5)
`);
    expect(symbols.seen).toBe(5);
  });

  it("do not leak parameters", () => {
    const { symbols } = run(`
function inner(p) { forward 1 }
function outer(q) { inner(q) }
outer(1)
`);
    expect(symbols).not.toHaveProperty("p");
    expect(symbols).not.toHaveProperty("q");
  });

  it("restore a global shadowed by a parameter", () => {
    const { symbols } = run(`
n = 1
function inner(n) { forward n }
function outer(n) { inner(n + 1) }
outer(10)
`);
    expect(symbols.n).toBe(1);
  });
});
