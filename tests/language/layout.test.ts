import { describe, expect, it } from "vitest";
import { run } from "../helpers";

describe("line breaks before braces", () => {
  it("are allowed after if", () => {
    expect(run("if 1 > 0\n{\n  forward 1\n}").lines).toHaveLength(1);
  });

  it("are allowed after while", () => {
    const { symbols } = run("x = 3\nwhile x > 0\n{\n  x = x - 1\n}");
    expect(symbols.x).toBe(0);
  });

  it("are allowed after for", () => {
    expect(run("for i in 1..3\n{\n  forward i\n}").lines).toHaveLength(3);
  });

  it("are allowed after a function signature", () => {
    expect(run("function f(n)\n{\n  forward n\n}\nf(1)").lines).toHaveLength(1);
  });

  it("are allowed after else", () => {
    expect(run("if 1 > 2 {\n  forward 1\n} else\n{\n  forward 2\n}").lines[0][2]).toBeCloseTo(2);
  });
});

describe("else on its own line", () => {
  it("is attached to the preceding if", () => {
    const { lines } = run(`
if 1 > 2 {
  forward 1
}
else {
  forward 2
}
`);
    expect(lines).toHaveLength(1);
    expect(lines[0][2]).toBeCloseTo(2);
  });

  it("can be separated by blank lines and comments", () => {
    const { lines } = run(`
if 1 > 2 {
  forward 1
}

// otherwise
else {
  forward 2
}
`);
    expect(lines).toHaveLength(1);
  });
});

describe("line breaks inside parentheses", () => {
  it("are allowed between call arguments", () => {
    expect(run("result = max(\n  1,\n  2\n)").symbols.result).toBe(2);
  });

  it("are allowed between function parameters", () => {
    const { symbols } = run(`
function add(
  a,
  b
) {
  return a + b
}
result = add(1, 2)
`);
    expect(symbols.result).toBe(3);
  });
});

describe("line breaks between statements", () => {
  it("still end a statement before a signed number", () => {
    const { symbols } = run("x = 1\n-1");
    expect(symbols.x).toBe(1);
  });

  it("still end a statement before a parenthesized expression", () => {
    const { symbols } = run("x = 1\n(2)");
    expect(symbols.x).toBe(1);
  });
});

describe("empty blocks", () => {
  it.each([
    ["on one line", "if 1 > 0 {}"],
    ["with a space", "if 1 > 0 { }"],
    ["across lines", "if 1 > 0 {\n}"],
    ["with only a comment", "if 1 > 0 {\n  // todo\n}"],
    ["as an else", "if 1 > 2 {\n  forward 1\n} else {}"],
    ["as a for body", "for i in 1..3 {}"],
    ["as a function body", "function f(n) {}\nf(1)"],
  ])("are allowed %s", (_, source) => {
    expect(run(source).lines).toHaveLength(0);
  });
});
