#!/usr/bin/env node
import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';

export const MANIFEST_PATH='security/file-manifest.json';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const patterns=[
  ['network API', /\b(?:fetch|WebSocket|XMLHttpRequest|EventSource)\s*\(/],
  ['dynamic code/import', /\b(?:eval|Function|require|import)\s*\(/],
  ['environment access', /\bprocess\s*\.\s*(?:env|binding|dlopen)\b/],
  ['global indirection', /\b(?:globalThis|global)\s*(?:\[|\.)/],
  ['encoded payload', /\b(?:atob|btoa)\s*\(|\bBuffer\s*\.\s*from\s*\([^\n]*['"](?:base64|hex)['"]/],
  ['credential/profile path', /(?:\.ssh\/|\.aws\/|\.config\/gcloud|Login Data|Library\/Keychains|browser[_-]?profile|\/proc\/|\/etc\/)/i],
];

/** Review aid: text patterns + imports + exact approved file hashes, not semantic proof. */
export function checkBundle(root,manifest,policy) {
  const issues=[],files=new Map();
  if(manifest?.version!==1||!Array.isArray(manifest.files)||policy?.version!==1||!policy.script_imports||typeof policy.script_imports!=='object')throw Error('Invalid security manifest/policy');
  const walk=dir=>{
    for(const name of readdirSync(dir)){
      const full=join(dir,name),path=relative(root,full).split('\\').join('/'),stat=lstatSync(full);
      if(stat.isSymbolicLink()){issues.push({path,reason:'Symlinks are not allowed in the portable bundle'});continue;}
      if(stat.isDirectory()){walk(full);continue;}
      if(!stat.isFile()){issues.push({path,reason:'Non-regular bundle entry'});continue;}
      if(path===MANIFEST_PATH)continue;
      files.set(path,readFileSync(full));
      if(!['.mjs','.md','.json','.yaml'].includes(extname(path))&&path!=='LICENSE')issues.push({path,reason:'Unreviewed file type'});
    }
  };
  walk(root);
  const approved=new Map();
  for(const item of manifest.files){
    if(!item||typeof item.path!=='string'||item.path.startsWith('/')||item.path.split('/').some(p=>p==='..'||p==='.')||approved.has(item.path)||!/^[a-f0-9]{64}$/.test(item.sha256??''))throw Error('Invalid/duplicate manifest file');
    approved.set(item.path,item.sha256);
  }
  for(const [path,bytes] of files){
    if(!approved.has(path))issues.push({path,reason:'New file is not in the reviewed manifest'});
    else if(sha256(bytes)!==approved.get(path))issues.push({path,reason:'File differs from the reviewed manifest'});
    if(!path.endsWith('.mjs'))continue;
    const allowed=policy.script_imports[path];
    if(!Array.isArray(allowed)){issues.push({path,reason:'Script has no reviewed import policy'});continue;}
    const source=bytes.toString('utf8');
    const gap=String.raw`(?:\s|/\*[\s\S]*?\*/|//[^\n]*(?:\n|$))*`;
    const declaration=new RegExp(String.raw`\b(?:import|export)${gap}(?:[^;]*?\bfrom${gap})?['"]([^'"]+)['"]`,'g');
    // The scanner's own regex literals are data that look like imports. Its
    // real import header is inspected here; the entire checker is hash-pinned
    // and must also be reviewed manually whenever changed.
    const importSource=path==='scripts/security-check.mjs'?source.split('\n\n')[0]:source;
    const imports=[...importSource.matchAll(declaration)].map(m=>m[1]);
    for(const specifier of imports)if(!allowed.includes(specifier))issues.push({path,reason:`Unapproved module: ${specifier}`});
    // The checker contains these literal detection patterns. Its bytes and
    // imports are still pinned, but applying its own pattern literals to itself
    // would confuse examples of forbidden code with executable behaviour.
    if(path!=='scripts/security-check.mjs')for(const [label,pattern] of patterns)if(pattern.test(source))issues.push({path,reason:`Review required: ${label}`});
  }
  for(const path of approved.keys())if(!files.has(path))issues.push({path,reason:'Reviewed file missing'});
  for(const path of Object.keys(policy.script_imports))if(!files.has(path))issues.push({path,reason:'Reviewed script missing'});
  return {status:issues.length?'FAIL':'PASS',files_checked:files.size,issues,
    limitations:['A passing scan is not proof that code/instructions are safe or that no backdoor exists.',
      'Manifest/policy changes and the checker itself require human review; a malicious maintainer can replace them.',
      'Host AI, connectors, browsers, operating system and account permissions are outside this offline check.']};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.length>2&&!(process.argv.length===3&&process.argv[2]==='--help'))throw Error('Use security-check.mjs or --help; no private input files are needed');
  if(process.argv[2]==='--help')console.log('Offline portable-bundle review gate. Verifies reviewed file hashes, script imports and limited risk patterns. No network, credential access or private-shop input. Read references/security-and-privacy.md; PASS is not a security guarantee.');
  else{
   const root=fileURLToPath(new URL('../',import.meta.url));
   for(const path of [MANIFEST_PATH,'security/capabilities.json']){
    const stat=lstatSync(join(root,path));if(!stat.isFile()||stat.isSymbolicLink())throw Error('Security manifest/policy must be regular files, not links');
   }
   const result=checkBundle(root,JSON.parse(readFileSync(join(root,MANIFEST_PATH),'utf8')),JSON.parse(readFileSync(join(root,'security/capabilities.json'),'utf8')));
   console.log(JSON.stringify(result,null,2));if(result.status!=='PASS')process.exitCode=1;
  }
 }catch(e){console.error(e.message);process.exitCode=2;}
}
