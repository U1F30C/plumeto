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
