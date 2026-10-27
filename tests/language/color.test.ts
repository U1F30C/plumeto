import { describe, expect, it } from "vitest";
import { run } from "../helpers";

describe("color", () => {
  it("draws lines without a color until one is set", () => {
    const { lines } = run("forward 1");
    expect(lines[0]).toHaveLength(4);
  });

  it("colors the lines drawn after it", () => {
    const { lines } = run("forward 1\ncolor red\nforward 1\ncolor #00ff88\nforward 1");
    expect(lines.map((line) => line[4])).toEqual([undefined, "red", "#00ff88"]);
  });

  it("goes back to the normal ink with default", () => {
    const { lines } = run("color blue\nforward 1\ncolor default\nforward 1");
    expect(lines.map((line) => line[4])).toEqual(["blue", undefined]);
  });

  it("is kept when set inside a function", () => {
    const { lines } = run("function paint() { color green }\npaint()\nforward 1");
    expect(lines[0][4]).toBe("green");
  });

  it("is not reset by breadcrumbs", () => {
    const { lines } = run("breadcrumb push\ncolor red\nbreadcrumb pop\nforward 1");
    expect(lines[0][4]).toBe("red");
  });

  it("accepts color names in any case", () => {
    expect(run("color Red\nforward 1").lines[0][4]).toBe("Red");
  });

  it("rejects unknown names and malformed hex codes", () => {
    expect(() => run("color reddish")).toThrow(/Unknown color "reddish"/);
    expect(() => run("color #12")).toThrow(/Unknown color/);
  });

  it("still allows color as a variable name", () => {
    expect(run("color = 3\nresult = color + 1").symbols.result).toBe(4);
  });
});
