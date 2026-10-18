import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { decodeScript, encodeScript } from "../src/share";

const longExample = readFileSync(join(__dirname, "../examples/l-systems/weed(expanded).plm"), "utf8");

describe("sharing scripts in a link", () => {
  it.each([
    ["a short script", "forward 10"],
    ["an empty script", ""],
    ["non-ASCII text", "// ñandú ✎ 🐢\nforward 1"],
    ["a long example", longExample],
  ])("round-trips %s", async (_, script) => {
    expect(await decodeScript(await encodeScript(script))).toBe(script);
  });

  it("only uses characters that are safe in a URL", async () => {
    expect(await encodeScript(longExample)).toMatch(/^[A-Za-z0-9_-]*$/);
  });

  it("compresses long scripts", async () => {
    expect((await encodeScript(longExample)).length).toBeLessThan(longExample.length / 4);
  });

  it.each([
    ["characters outside base64url", "not valid!"],
    ["valid base64url that isn't compressed data", "aGVsbG8gd29ybGQ"],
  ])("returns null for %s", async (_, encoded) => {
    expect(await decodeScript(encoded)).toBeNull();
  });
});
