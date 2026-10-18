import { describe, expect, it } from "vitest";
import { run } from "../helpers";

describe("comments", () => {
  it("can take a whole line", () => {
    expect(run("// draw a line\nforward 10").lines).toHaveLength(1);
  });

  it("can trail a statement", () => {
    expect(run("forward 10 // go\nforward 10").lines).toHaveLength(2);
  });

  it("can end the file without a newline", () => {
    expect(run("forward 10\n// done").lines).toHaveLength(1);
  });

  it("can be the whole program", () => {
    expect(run("// nothing here").lines).toHaveLength(0);
  });

  it("can stack and mix with blank lines", () => {
    const source = `
// first
// second

forward 10

// third
forward 10
`;
    expect(run(source).lines).toHaveLength(2);
  });

  it("can appear inside blocks and function bodies", () => {
    const source = `
function f(n) { // header
  // body
  forward n // trailing
}
for i in 1..2 {
  // loop body
  f(i)
}
if 1 == 1 {
  forward 1 // then
} else { // else
  // nothing
  forward 1
}
`;
    expect(run(source).lines).toHaveLength(3);
  });

  it("does not interfere with division", () => {
    expect(run("result = 10/2 // half").symbols.result).toBe(5);
  });

  it("hides code on the rest of the line", () => {
    expect(run("// forward 10\nforward 1").lines).toHaveLength(1);
  });
});
