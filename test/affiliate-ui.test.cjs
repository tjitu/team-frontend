const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function compile(relative,aliases={}) {
 const file=path.resolve(process.cwd(),relative),m=new Module(file,module);m.paths=Module._nodeModulePaths(process.cwd());
 const original=m.require.bind(m);m.require=id=>id in aliases?aliases[id]:id.endsWith('.module.css')?new Proxy({},{get:(_,key)=>String(key)}):original(id);
 m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
 return m.exports;
}
const types=compile('src/components/affiliate/types.ts');
test('agreement Markdown renders unsafe HTML as readable escaped text',()=>{
 const {AgreementDocument}=compile('src/components/affiliate/agreement-document.tsx');
 const html=renderToStaticMarkup(React.createElement(AgreementDocument,{content:'# Agreement\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n## Terms\n**Bold**'}));
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));
 assert.ok(html.includes('<h1>Agreement</h1>'));assert.ok(html.includes('<strong>Bold</strong>'));
});
test('rate display follows server boost snapshots, independent timers and transaction caps',()=>{
 const now=Date.now(),data={profile:{config:{commission:1000,discount:1500}},boosts:[
  {id:'commission',group:'COMMISSION',baseRate:1000,additional:500,expiresAt:new Date(now+60000).toISOString(),maxTransactions:null},
  {id:'discount',group:'DISCOUNT',baseRate:1500,additional:1000,expiresAt:new Date(now-1).toISOString(),maxTransactions:null},
 ]};
 assert.deepEqual(types.effectiveRates(data,now),{commission:1500,discount:1500});
 data.boosts[0].maxTransactions=1;data.boosts[0].reservedTransactions=1;
 assert.deepEqual(types.effectiveRates(data,now),{commission:1000,discount:1500});
});
