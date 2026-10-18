import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { run, seededRandom } from "../helpers";

const examplesDir = join(__dirname, "../../examples");
const examples = readdirSync(examplesDir).filter((f) => f.endsWith(".plm"));

// Fingerprints each example's drawing so any change to its output gets flagged.
// If a change is intended, review the diff and update with `pnpm test -u`.
describe("examples", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(examples)("%s", (file) => {
    vi.spyOn(Math, "random").mockImplementation(seededRandom(42));
    const { lines } = run(readFileSync(join(examplesDir, file), "utf8"));
    const coords = lines.flat().map((n) => n.toFixed(3));
    expect({
      segments: lines.length,
      hash: createHash("sha1").update(coords.join(",")).digest("hex"),
    }).toMatchSnapshot();
  });
});
