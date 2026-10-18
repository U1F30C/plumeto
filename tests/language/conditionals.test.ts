import { describe, expect, it } from "vitest";
import { run } from "../helpers";

describe("else if", () => {
  const classify = `
function classify(n) {
  if n < 0 {
    return -1
  } else if n == 0 {
    return 0
  } else {
    return 1
  }
}
`;

  it.each([
    [-5, -1],
    [0, 0],
    [5, 1],
  ])("picks the matching branch for %d", (input, expected) => {
    expect(run(`${classify}result = classify(${input})`).symbols.result).toBe(expected);
  });

  it("runs no branch when nothing matches and there is no else", () => {
    const { lines } = run(`
if 1 > 2 {
  forward 1
} else if 1 > 3 {
  forward 2
}
`);
    expect(lines).toHaveLength(0);
  });

  it("runs only the first matching branch", () => {
    const { lines } = run(`
if 1 > 2 {
  forward 1
} else if 1 > 0 {
  forward 2
} else if 2 > 0 {
  forward 3
} else {
  forward 4
}
`);
    expect(lines).toHaveLength(1);
    expect(lines[0][2]).toBeCloseTo(2);
  });

  it("can start on its own line", () => {
    const { lines } = run(`
if 1 > 2 {
  forward 1
}
else if 1 > 0 {
  forward 2
}
`);
    expect(lines).toHaveLength(1);
  });
});
