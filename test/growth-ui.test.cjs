const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const file=path.resolve('src/components/registration-growth/types.ts'),mod=new Module(file,module);
mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,file);
const {verificationItems,rejectionOptions,formatGrowthDate}=mod.exports;
const config={items:{follow:{enabled:true,required:true},likeTag:{enabled:true,required:true},story:{enabled:true,required:true}},mentionRequired:true};
test('admin checklist expands participant claims into five independent confirmations',()=>{
 const items=verificationItems(config);assert.deepEqual(items.map(x=>x.key),['follow','like','tag','story','mention']);assert.ok(items.every(x=>x.required));
});
test('disabled and optional requirements control only the corresponding administrator checks',()=>{
 const items=verificationItems({...config,items:{...config.items,follow:{enabled:false,required:true},likeTag:{enabled:true,required:false}},mentionRequired:false});
 assert.deepEqual(items.map(x=>[x.key,x.required]),[['like',false],['tag',false],['story',true]]);
 assert.deepEqual(verificationItems({...config,items:{follow:{enabled:false},likeTag:{enabled:false},story:{enabled:false}}}),[]);
});
test('rejection options cover required social checks, missing accounts and unverifiable activity',()=>{
 assert.equal(rejectionOptions.length,7);assert.ok(rejectionOptions.includes('Username Instagram tidak ditemukan.'));assert.ok(rejectionOptions.includes('Aktivitas Instagram tidak dapat diverifikasi.'));
});
test('queue timestamps use WIB regardless of host timezone',()=>{
 assert.match(formatGrowthDate('2026-11-28T18:30:00Z'),/29 Nov 2026/);assert.match(formatGrowthDate('2026-11-28T18:30:00Z'),/01[.:]30/);
});
