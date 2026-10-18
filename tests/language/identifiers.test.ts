import { describe, expect, it } from "vitest";
import { parse, run } from "../helpers";

describe("names that start with a keyword", () => {
  it.each([
    "forward_line",
    "rotate_by",
    "place_at",
    "cursor_on",
    "breadcrumb_trail",
    "if_ready",
    "while_true",
    "for_each",
    "function_like",
    "return_home",
  ])("can be called as %s", (name) => {
    const { lines } = run(`
function ${name}(n) {
  forward n
}
${name}(2)
`);
    expect(lines).toHaveLength(1);
    expect(lines[0][2]).toBeCloseTo(2);
  });

  it("are not split into a keyword and a name", () => {
    expect(() => run("x = 1\nforwardx")).toThrow(/forwardx/);
    expect(() => run("cursoroff")).toThrow(/cursoroff/);
  });
});

describe("keywords", () => {
  it("can be followed by parentheses", () => {
    expect(run("if(1 > 0){\n  forward(10)\n}").lines).toHaveLength(1);
  });

  it("allow units right after a number", () => {
    expect(run("rotate 90deg\nforward 1").lines[0][3]).toBeCloseTo(1);
  });
});

describe("identifiers with digits", () => {
  it("can be assigned and read", () => {
    expect(run("x1 = 3\ny2 = x1 * 2").symbols.y2).toBe(6);
  });

  it("can name functions, parameters and loop variables", () => {
    const { lines } = run(`
function step2(size1) {
  forward size1
}
for i2 in 1..3 {
  step2(i2)
}
`);
    expect(lines).toHaveLength(3);
  });

  it("cannot start with a digit", () => {
    expect(() => parse("1x = 3")).toThrow();
  });
});
