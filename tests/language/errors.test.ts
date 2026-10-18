import { describe, expect, it } from "vitest";
import { PlumetoError } from "../../src/language/errors";
import { execute } from "../../src/language/execute";
import { LineSegment } from "../../src/language/program_runner";

function failure(source: string) {
  const lines: LineSegment[] = [];
  try {
    execute(source, (line) => lines.push(line));
  } catch (error) {
    return { error: error as PlumetoError, lines };
  }
  throw new Error("expected the script to fail");
}

describe("syntax errors", () => {
  it("report where parsing failed", () => {
    const { error } = failure("forward 1\nforward )");
    expect(error).toBeInstanceOf(PlumetoError);
    expect(error.kind).toBe("syntax");
    expect(error.location?.start).toMatchObject({ line: 2, column: 9 });
  });

  it("name the unexpected text", () => {
    expect(failure("forward 1\nforward )").error.message).toBe('Unexpected ")"');
  });

  it("say when the script ends too early", () => {
    expect(failure("if 1 > 0 {\n  forward 1\n").error.message).toBe(
      "Unexpected end of script"
    );
  });

  it("draw nothing", () => {
    expect(failure("forward 1\nforward )").lines).toHaveLength(0);
  });
});

describe("runtime errors", () => {
  it("point at an unknown identifier", () => {
    const { error } = failure("x = 1\nforward x + y");
    expect(error).toBeInstanceOf(PlumetoError);
    expect(error.kind).toBe("runtime");
    expect(error.message).toMatch(/Unknown identifier: y/);
    expect(error.location?.start).toMatchObject({ line: 2, column: 13 });
    expect(error.location?.end).toMatchObject({ line: 2, column: 14 });
  });

  it("point at an unknown function call", () => {
    const { error } = failure("forward 1\n  draw(3)");
    expect(error.message).toMatch(/Unknown function: draw/);
    expect(error.location?.start).toMatchObject({ line: 2, column: 3 });
  });

  it("point inside the function body rather than at the call", () => {
    const { error } = failure(`
function f(n) {
  forward n
  forward missing
}
f(1)
`);
    expect(error.location?.start.line).toBe(4);
  });

  it("point at a breadcrumb pop with nothing pushed", () => {
    const { error } = failure("forward 1\nbreadcrumb pop");
    expect(error.message).toMatch(/breadcrumb/i);
    expect(error.location?.start.line).toBe(2);
  });

  it("point at a return outside of a function", () => {
    const { error } = failure("forward 1\n\nreturn 1");
    expect(error.message).toMatch(/outside of a function/);
    expect(error.location?.start.line).toBe(3);
  });

  it("point at the statement for other failures", () => {
    const { error } = failure(`
function loop(n) {
  return loop(n + 1)
}
x = loop(1)
`);
    expect(error.kind).toBe("runtime");
    expect(error.location).toBeDefined();
  });

  it("keep the lines drawn before the failure", () => {
    expect(failure("forward 1\nforward 2\nforward oops").lines).toHaveLength(2);
  });
});
