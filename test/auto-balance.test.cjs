const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, name) => mod._compile(ts.transpileModule(fs.readFileSync(name, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, name);
const { computePackageAutoBalancePlan, buildAutoBalancedBatchPrompt } = require('../src/components/question-lifecycle-types.ts');
const { buildChunkPlan } = require('../src/components/question-prompt-chunks.ts');
const groups = ['PENGETAHUAN_KUANTITATIF', 'PENALARAN_MATEMATIKA', 'PENALARAN_UMUM'];
function plan(existing = []) { return computePackageAutoBalancePlan({ destination: 'FOR_TRYOUT', packageQuestions: existing, curriculumTopics: [], count: 60, prescribedSubtests: groups.flatMap(s => Array(20).fill(s)), targetIsianPct: 15, difficultyRatio: { easy: 30, medium: 50, hard: 20 } }); }
test('balances type and difficulty separately for each subtest', () => {
 const { slots } = plan();
 for (const [i, name] of groups.entries()) { const group = slots.filter(s => s.subtest === name); assert.equal(group.length,20); assert.equal(group.filter(s => s.questionType === 'ISIAN_SINGKAT').length, i < 2 ? 3 : 0); for(const [d,n] of [['EASY',6],['MEDIUM',10],['HARD',4]]) assert.equal(group.filter(s => s.difficulty===d).length,n); }
});
test('each chunk prompt states the exact slots and preserves type distribution', () => {
 const slots=plan().slots; const chunks=buildChunkPlan(60,6,slots,(offset,size)=>buildAutoBalancedBatchPrompt({packageLabel:'Test', slots:slots.slice(offset,offset+size).map((s,i)=>({...s,index:i+1}))})).chunks;
 assert.equal(chunks.length,6); for(const chunk of chunks){assert.equal(chunk.slots.length,10); assert.match(chunk.prompt,/DISTRIBUSI KHUSUS CHUNK INI PER SUBTES/); const short=chunk.slots.filter(s=>s.questionType==='ISIAN_SINGKAT').length; assert.ok(short <= 2); assert.equal((chunk.prompt.match(/Tipe="ISIAN_SINGKAT"/g)||[]).length,short)}
});
test('an imbalanced existing subtest does not make the new batch one type or difficulty',()=>{const existing=Array.from({length:20},()=>({subtest:groups[0],difficulty:'MEDIUM',type:'PILIHAN_GANDA'}));const slots=plan(existing).slots.filter(s=>s.subtest===groups[0]);assert.equal(slots.filter(s=>s.questionType==='ISIAN_SINGKAT').length,3);for(const [d,n] of [['EASY',6],['MEDIUM',10],['HARD',4]]) assert.equal(slots.filter(s=>s.difficulty===d).length,n)});
test('handles small subtests and zero short-answer targets',()=>{const {slots}=computePackageAutoBalancePlan({destination:'FOR_TRYOUT',packageQuestions:[],curriculumTopics:[],count:3,prescribedSubtests:groups,targetIsianPct:0,difficultyRatio:{easy:0,medium:100,hard:0}});assert.equal(slots.length,3);assert.ok(slots.every(s=>s.questionType==='PILIHAN_GANDA' && s.difficulty==='MEDIUM'))});
