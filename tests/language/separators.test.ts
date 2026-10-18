import { describe, expect, it } from "vitest";
import { PlumetoError } from "../../src/language/errors";
import { execute } from "../../src/language/execute";
import { run } from "../helpers";

describe("semicolons", () => {
  it("separate statements on one line", () => {
    expect(run("forward 1; rotate 90 deg; forward 2").lines).toHaveLength(2);
  });

  it("allow whitespace around them", () => {
    expect(run("forward 1 ;forward 2 ;  forward 3").lines).toHaveLength(3);
  });

  it("can be mixed with line breaks", () => {
    expect(run("forward 1; forward 2\nforward 3;\nforward 4").lines).toHaveLength(4);
  });

  it("work inside one-line blocks", () => {
    const { lines } = run("for i in 1..4 { forward 10; rotate 90 deg }");
    expect(lines).toHaveLength(4);
  });

  it("work in one-line if/else blocks", () => {
    const { symbols } = run("if 1 > 2 { a = 1; b = 1 } else { a = 2; b = 2 }");
    expect(symbols).toMatchObject({ a: 2, b: 2 });
  });

  it("work in function bodies", () => {
    const { symbols } = run("function f(n) { x = n * 2; return x + 1 }\nresult = f(3)");
    expect(symbols.result).toBe(7);
  });

  it("can be followed by a comment", () => {
    expect(run("forward 1; // first\nforward 2; // second").lines).toHaveLength(2);
  });

  it("may trail the last statement of a block or script", () => {
    expect(run("if 1 > 0 { forward 1; }\nforward 2;").lines).toHaveLength(2);
  });

  it("keep each statement's own error location", () => {
    let error: PlumetoError | undefined;
    try {
      execute("forward 1; forward oops", () => {});
    } catch (e) {
      error = e as PlumetoError;
    }
    expect(error?.message).toMatch(/Unknown identifier: oops/);
    expect(error?.location?.start).toMatchObject({ line: 1, column: 20 });
  });

  it.each([
    ["two in a row", "forward 1;; forward 2"],
    ["a leading one", "; forward 1"],
    ["one on its own", "forward 1\n;\nforward 2"],
  ])("reject %s", (_, source) => {
    expect(() => run(source)).toThrow();
  });
});
