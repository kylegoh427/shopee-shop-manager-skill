import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,symlinkSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {checkBundle} from '../skills/shopee-shop-manager/scripts/security-check.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
function fixture(fn){const root=mkdtempSync(join(tmpdir(),'shopee-security-'));try{
 mkdirSync(join(root,'scripts'));writeFileSync(join(root,'scripts/demo.mjs'),"import {readFileSync} from 'node:fs';\nexport const value=1;\n");
 const manifest={version:1,files:[{path:'scripts/demo.mjs',sha256:hash(readFileSync(join(root,'scripts/demo.mjs')))}]};
 const policy={version:1,script_imports:{'scripts/demo.mjs':['node:fs']}};
 fn(root,manifest,policy);
}finally{rmSync(root,{recursive:true,force:true});}}
test('unchanged reviewed source passes; a changed byte requires review',()=>fixture((root,m,p)=>{
 assert.equal(checkBundle(root,m,p).status,'PASS');writeFileSync(join(root,'scripts/demo.mjs'),'export const value=2;');
 assert.equal(checkBundle(root,m,p).status,'FAIL');
}));
test('network, execution and environment capabilities are flagged even if someone refreshes hashes',()=>{
 for(const source of ["import https from 'node:https';", "fetch('https://example.invalid/collector');", "const x=process.env;", "eval('1');", "import('node:net');", "const x=globalThis['fetch'];", "const x=Buffer.from('abc','base64');"])
 fixture((root,m,p)=>{writeFileSync(join(root,'scripts/demo.mjs'),source);m.files[0].sha256=hash(source);assert.equal(checkBundle(root,m,p).status,'FAIL',source);});
});
test('compact, same-line and commented import forms do not bypass the module review gate',()=>{
 for(const source of ["import{request}from'node:https';", "import {readFileSync} from 'node:fs'; import 'node:https';", "import/* comment */{request}from/* comment */'node:https';", "export{request}from'node:https';"])
 fixture((root,m,p)=>{writeFileSync(join(root,'scripts/demo.mjs'),source);m.files[0].sha256=hash(source);assert.ok(checkBundle(root,m,p).issues.some(x=>x.reason==='Unapproved module: node:https'),source);});
});
test('unexpected files, scripts and symlinks do not quietly enter the portable bundle',()=>fixture((root,m,p)=>{
 writeFileSync(join(root,'extra.sh'),'echo example');assert.equal(checkBundle(root,m,p).status,'FAIL');
 symlinkSync(join(root,'scripts/demo.mjs'),join(root,'link.mjs'));
 assert.ok(checkBundle(root,m,p).issues.some(x=>x.reason.includes('Symlinks')));
}));
test('deleted reviewed files and malformed/duplicate manifest records fail explicitly',()=>fixture((root,m,p)=>{
 assert.throws(()=>checkBundle(root,{version:1,files:[...m.files,...m.files]},p),/manifest/);
 rmSync(join(root,'scripts/demo.mjs'));assert.equal(checkBundle(root,m,p).status,'FAIL');
}));
test('published package has no dependency installs, lifecycle hooks or unexpected npm commands',()=>{
 const p=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 for(const key of ['dependencies','devDependencies','optionalDependencies','peerDependencies'])assert.equal(Object.keys(p[key]??{}).length,0);
 assert.deepEqual(p.scripts,{
  test:'node --test tests/*.test.mjs',
  'eval:check':'node skills/shopee-shop-manager/scripts/agent-scorecard.mjs check-suite',
  'eval:list':'node skills/shopee-shop-manager/scripts/agent-scorecard.mjs list',
  'security:check':'node skills/shopee-shop-manager/scripts/security-check.mjs',
  'security:update-manifest':'node scripts/update-security-manifest.mjs',
 });
});
test('CI runs the offline gate before tests with read-only tokens and no persisted checkout credentials',()=>{
 const y=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
 assert.ok(y.includes('contents: read'));assert.ok(y.includes('persist-credentials: false'));
 assert.ok(y.indexOf('run: node skills/shopee-shop-manager/scripts/security-check.mjs')<y.indexOf('run: npm test'));
 assert.ok(!y.includes('pull_request_target'));assert.ok(!y.includes('secrets.'));
 for(const use of y.matchAll(/uses:\s+([^\s]+)/g))assert.match(use[1],/@[a-f0-9]{40}$/);
});
