import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,lstatSync,statSync,symlinkSync,linkSync,chmodSync,readdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {writePrivateReport} from '../skills/shopee-shop-manager/scripts/reconcile-catalog.mjs';

function fixture(fn){const dir=mkdtempSync(join(tmpdir(),'shopee-private-output-'));try{fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}}
test('new report is private and cannot overwrite an existing path by default',()=>fixture(dir=>{
 const out=join(dir,'audit.json');writePrivateReport(out,'first');
 assert.equal(readFileSync(out,'utf8'),'first');
 if(process.platform!=='win32')assert.equal(statSync(out).mode&0o777,0o600);
 assert.throws(()=>writePrivateReport(out,'second'),/exists/);assert.equal(readFileSync(out,'utf8'),'first');
}));
test('both existing and dangling symlink destinations are rejected without touching targets',()=>fixture(dir=>{
 for(const exists of [false,true]){
  const target=join(dir,exists?'existing':'missing'),out=join(dir,exists?'linked-existing':'linked-missing');
  if(exists)writeFileSync(target,'original');symlinkSync(target,out);
  for(const overwrite of [false,true])assert.throws(()=>writePrivateReport(out,'private-data',overwrite),/regular file/);
  assert.ok(lstatSync(out).isSymbolicLink());
  if(exists)assert.equal(readFileSync(target,'utf8'),'original');else assert.throws(()=>statSync(target),{code:'ENOENT'});
 }
}));
test('explicit replacement tightens old permissions and does not truncate another hard link',()=>fixture(dir=>{
 const original=join(dir,'other-file'),out=join(dir,'audit.json');writeFileSync(original,'original');chmodSync(original,0o644);linkSync(original,out);
 writePrivateReport(out,'new-report',true);
 assert.equal(readFileSync(original,'utf8'),'original');assert.equal(readFileSync(out,'utf8'),'new-report');
 assert.notEqual(statSync(original).ino,statSync(out).ino);
 if(process.platform!=='win32')assert.equal(statSync(out).mode&0o777,0o600);
 assert.equal(readdirSync(dir).length,2);
}));
test('directory outputs are rejected and leave contents intact',()=>fixture(dir=>{
 assert.throws(()=>writePrivateReport(dir,'data',true),/regular file/);assert.deepEqual(readdirSync(dir),[]);
}));
