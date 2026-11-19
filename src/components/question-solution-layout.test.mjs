import assert from "node:assert/strict";
import test from "node:test";
import { readImportedSteps, solutionStepsExample } from "./question-solution-layout.ts";

test("comparison of numbered subsets stays on one page with all original evidence", () => {
  const input = ["Kenali konsep", "Cek Bait 1 dan 3", "Cek Bait 2", "Uji pilihan"].map((category, i) =>
    ({ category, title: "Judul " + i, content: "Bukti " + i })
  );
  const result = readImportedSteps(input);
  assert.deepEqual(result.map(step => step.category), ["Kenali konsep", "Bandingkan bait", "Uji pilihan"]);
  assert.deepEqual(result.map(step => step.stepNumber), [1, 2, 3]);
  assert.equal(result[1].content, "Judul 1\nBukti 1\n\nJudul 2\nBukti 2");
  assert.equal(readImportedSteps([{category:"Cek (1)–(2)"}, {category:"Cek (3)–(4)"}]).length, 1);
});

test("distinct operations and different subjects remain independent", () => {
  for (const categories of [["Komposisi", "Invers"], ["Cek bait 1", "Cek kalimat 2"]]) {
    assert.deepEqual(readImportedSteps(categories.map(category => ({ category }))).map(step => step.category), categories);
  }
});

test("one complete explanation is a valid authoring example", () => {
  const [step] = JSON.parse(solutionStepsExample("Keputusannya B."));
  assert.ok(step.content.includes("\n• "));
  assert.ok(step.content.endsWith("Keputusannya B."));
});
