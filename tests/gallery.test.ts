import { describe, expect, it } from "vitest";
import { exampleCategories, exampleGroups, examples, featuredExamples } from "../src/examples";

describe("example gallery", () => {
  it("puts every example under exactly one chip", () => {
    for (const example of examples) {
      const chips = exampleCategories.filter((category) => category.folders.includes(example.group!));
      expect(chips.map((chip) => chip.label), example.fileName).toHaveLength(1);
    }
  });

  it("only gathers folders that have a heading", () => {
    const folders = exampleGroups.map((group) => group.folder);
    for (const category of exampleCategories) {
      for (const folder of category.folders) expect(folders).toContain(folder);
    }
  });

  it("only features examples that exist, once each", () => {
    const names = examples.map((example) => example.fileName);
    for (const name of featuredExamples) expect(names).toContain(name);
    expect(new Set(featuredExamples).size).toBe(featuredExamples.length);
  });

  it("lists the weeds first among the L-systems", () => {
    const names = examples.filter((example) => example.group === "l-systems").map((example) => example.fileName);
    expect(names.slice(0, 3)).toEqual(["weed.plm", "weed(stochastic).plm", "weed(expanded).plm"]);
  });
});
