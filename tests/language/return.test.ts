import { describe, expect, it } from "vitest";
import { run } from "../helpers";

describe("return", () => {
  it("works as the only statement", () => {
    const { symbols } = run(`
function double(n) {
  return n*2
}
result = double(4)
`);
    expect(symbols.result).toBe(8);
  });

  it("works after other statements", () => {
    const { symbols, lines } = run(`
function step(n) {
  forward n
  return n*2
}
result = step(5)
`);
    expect(symbols.result).toBe(10);
    expect(lines).toHaveLength(1);
  });

  it("works inside an if block", () => {
    const { symbols } = run(`
function sign(n) {
  if n < 0 {
    return -1
  }
  return 1
}
a = sign(-5)
b = sign(5)
`);
    expect(symbols.a).toBe(-1);
    expect(symbols.b).toBe(1);
  });

  it("works inside an else block", () => {
    const { symbols } = run(`
function pick(n) {
  if n > 0 {
    x = 1
  } else {
    return 2
  }
  return 3
}
a = pick(-1)
b = pick(1)
`);
    expect(symbols.a).toBe(2);
    expect(symbols.b).toBe(3);
  });

  it("exits a for loop early", () => {
    const { symbols, lines } = run(`
function firstSquareOver(limit) {
  for i in 1..100 {
    forward 1
    if i*i > limit {
      return i
    }
  }
  return 0
}
result = firstSquareOver(50)
`);
    expect(symbols.result).toBe(8);
    expect(lines).toHaveLength(8);
  });

  it("exits a while loop early", () => {
    const { symbols } = run(`
function countdown(n) {
  while n > 0 {
    if n == 3 {
      return n
    }
    n = n - 1
  }
  return 0
}
result = countdown(10)
`);
    expect(symbols.result).toBe(3);
  });

  it("skips statements after it", () => {
    const { lines } = run(`
function f(n) {
  return n
  forward 10
}
result = f(1)
`);
    expect(lines).toHaveLength(0);
  });

  it("supports recursion", () => {
    const { symbols } = run(`
function fact(n) {
  if n <= 1 {
    return 1
  }
  return n * fact(n-1)
}
result = fact(5)
`);
    expect(symbols.result).toBe(120);
  });

  it("only exits the innermost function", () => {
    const { symbols, lines } = run(`
function inner(n) {
  return n+1
}
function outer(n) {
  a = inner(n)
  forward 1
  return a*10
}
result = outer(1)
`);
    expect(symbols.result).toBe(20);
    expect(lines).toHaveLength(1);
  });

  it("is not allowed outside a function", () => {
    expect(() => run("forward 1\nreturn 1")).toThrow(/outside of a function/);
  });

  it("is not confused with identifiers that start with return", () => {
    expect(run("returned = 1\nresult = returned + 1").symbols.result).toBe(2);
  });

  it("is optional", () => {
    const { lines } = run(`
function square(size) {
  for i in 1..4 {
    forward size
    rotate 90 deg
  }
}
square(10)
`);
    expect(lines).toHaveLength(4);
  });
});
