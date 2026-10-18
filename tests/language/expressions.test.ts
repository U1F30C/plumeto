import { describe, expect, it } from "vitest";
import { evaluate, run } from "../helpers";

describe("arithmetic precedence", () => {
  it.each([
    ["2+3*4", 14],
    ["(2+3)*4", 20],
    ["2*3^2", 18],
    ["-2+5", 3],
  ])("%s = %d", (expression, expected) => {
    expect(evaluate(expression)).toBe(expected);
  });
});

describe("left associativity", () => {
  it.each([
    ["10-3-2", 5],
    ["10-2+3", 11],
    ["100/10/2", 5],
    ["17%5%3", 2],
    ["8/4*2", 4],
  ])("%s = %d", (expression, expected) => {
    expect(evaluate(expression)).toBe(expected);
  });

  it("keeps ^ right associative", () => {
    expect(evaluate("2^3^2")).toBe(512);
  });
});

describe("function calls inside expressions", () => {
  it("accepts a call after an operator", () => {
    expect(run("a = 3\nresult = a*4+sin(0)").symbols.result).toBe(12);
  });

  it("accepts an operator after a call", () => {
    expect(evaluate("sin(0)*2+1")).toBe(1);
  });

  it("accepts calls with several arguments", () => {
    expect(evaluate("1 + max(2, 3)")).toBe(4);
  });

  it("accepts calls on both sides of an operator", () => {
    expect(evaluate("abs(-2) - abs(-1)")).toBe(1);
  });

  it("accepts user defined functions", () => {
    const { symbols } = run(`
function double(n) {
  return n*2
}
result = double(3)+1
`);
    expect(symbols.result).toBe(7);
  });

  it("stores the result of a user defined function in a variable", () => {
    const { symbols } = run(`
function five(n) {
  return 5
}
result = five(0)
`);
    expect(symbols.result).toBe(5);
  });

  it("accepts calls in command arguments", () => {
    const { lines } = run("forward cos(0)*10");
    expect(lines).toHaveLength(1);
    expect(lines[0][2]).toBeCloseTo(10);
  });

  it("accepts calls in conditions", () => {
    expect(run("if sin(0)+1 == 1 {\n  result = 1\n}").symbols.result).toBe(1);
  });
});
