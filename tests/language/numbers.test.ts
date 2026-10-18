import { describe, expect, it } from "vitest";
import { evaluate, run } from "../helpers";

describe("numbers", () => {
  it.each([
    ["3", 3],
    ["3.25", 3.25],
    ["-2", -2],
    [".5", 0.5],
    ["-.5", -0.5],
    ["+.5", 0.5],
    ["2*.5", 1],
  ])("%s = %d", (expression, expected) => {
    expect(evaluate(expression)).toBe(expected);
  });

  it("can start with a dot in command arguments", () => {
    expect(run("forward .5").lines[0][2]).toBeCloseTo(0.5);
  });

  it("do not break integer ranges", () => {
    expect(run("for i in 1..3 {\n  forward i\n}").lines).toHaveLength(3);
  });

  it("do not break fractional ranges", () => {
    expect(run("for i in 0.5..2.5 {\n  forward i\n}").lines).toHaveLength(3);
  });
});
