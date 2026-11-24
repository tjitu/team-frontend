const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, name) => mod._compile(ts.transpileModule(fs.readFileSync(name, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, name);
const { computePackageAutoBalancePlan, buildAutoBalancedBatchPrompt, OFFICIAL_SNBT_SUBTEST_SPEC } = require('../src/components/question-lifecycle-types.ts');
const { buildChunkPlan } = require('../src/components/question-prompt-chunks.ts');
const fullExam = OFFICIAL_SNBT_SUBTEST_SPEC.flatMap(spec => Array(spec.fullQuestionTarget).fill(spec.value));
const countShort = slots => slots.filter(slot => slot.questionType === 'ISIAN_SINGKAT').length;
function plan(overrides = {}) {
  return computePackageAutoBalancePlan({
    destination: 'FOR_TRYOUT', packageQuestions: [], curriculumTopics: [], count: 160,
    prescribedSubtests: fullExam, targetIsianPct: 20, difficultyRatio: { easy: 30, medium: 50, hard: 20 },
    ...overrides,
  });
}

test('a fresh 160-question plan allocates the package percentage to PK and PM', () => {
  const existing = fullExam.map(subtest => ({ subtest, type: 'MULTIPLE_CHOICE' }));
  const { slots } = plan({ packageQuestions: existing });
  assert.equal(slots.length, 160);
  assert.equal(countShort(slots), 32);
  for (const spec of OFFICIAL_SNBT_SUBTEST_SPEC) {
    const group = slots.filter(slot => slot.subtest === spec.value);
    assert.equal(group.length, spec.fullQuestionTarget);
    assert.equal(countShort(group), ['PK','PM'].includes(spec.code) ? 16 : 0);
    for (const [level, ratio] of [['EASY', .3], ['MEDIUM', .5], ['HARD', .2]]) {
      assert.equal(group.filter(slot => slot.difficulty === level).length, group.length * ratio);
    }
  }
});

test('the headers and numbered instructions of every chunk sum to the same package quota', () => {
  const { slots } = plan();
  for (const count of [2, 7, 13, 160]) {
    const { chunks } = buildChunkPlan(slots.length, count, slots, (offset, size) => buildAutoBalancedBatchPrompt({
      packageLabel: 'Tryout Perdana', slots: slots.slice(offset, offset + size).map((s, i) => ({ ...s, index: i + 1 })),
    }));
    let totalShort = 0;
    for (const chunk of chunks) {
      const short = countShort(chunk.slots);
      assert.equal((chunk.prompt.match(/Tipe="ISIAN_SINGKAT"/g) || []).length, short);
      assert.ok(chunk.prompt.includes(`Tipe Soal: ${chunk.slots.length - short} Pilihan Ganda (A-E) · ${short} Isian Singkat`));
      totalShort += short;
    }
    assert.equal(totalShort, 32);
  }
});

test('rounds the package quota once and reports insufficient numeric capacity', () => {
  for (const pct of [0, 1, 7, 15, 24, 25, 26, 50, 100]) {
    const result = plan({ targetIsianPct: pct });
    assert.equal(result.requestedShort, Math.round(160 * pct / 100));
    assert.equal(result.shortCapacity, 40);
    assert.equal(countShort(result.slots), Math.min(40, result.requestedShort));
  }
});

test('generating the seven official subtests separately reproduces the complete plan', () => {
  const full = plan({ targetIsianPct: 7 }).slots;
  for (const spec of OFFICIAL_SNBT_SUBTEST_SPEC) {
    const subtest = plan({ targetIsianPct: 7, prescribedSubtests: Array(spec.fullQuestionTarget).fill(spec.value) });
    assert.equal(countShort(subtest.slots), countShort(full.filter(slot => slot.subtest === spec.value)));
  }
});

test('a custom top-up accounts for existing answers, practice keeps its subtest target', () => {
  const packageQuestions = Array.from({ length: 10 }, () => ({ subtest: 'PENGETAHUAN_KUANTITATIF', type: 'SHORT_ANSWER' }));
  const topUp = plan({ packageQuestions, count: 10, prescribedSubtests: undefined, scopeSubtest: 'PENGETAHUAN_KUANTITATIF' });
  assert.equal(countShort(topUp.slots), 0);
  assert.equal(countShort(plan({ destination: 'FOR_PRACTICE' }).slots), 8);
});
