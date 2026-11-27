#!/usr/bin/env node
// Maintainer command, never an install/CI repair hook. Review the diff first.
import {readFileSync,readdirSync,lstatSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../skills/shopee-shop-manager/',import.meta.url));
const files=[];
function walk(dir){for(const name of readdirSync(dir)){
 const full=join(dir,name),path=relative(root,full).split('\\').join('/'),s=lstatSync(full);
 if(s.isSymbolicLink())throw Error(`Refusing symlink: ${path}`);
 if(s.isDirectory()){walk(full);continue;}
 if(!s.isFile())throw Error(`Refusing non-regular file: ${path}`);
 if(path==='security/file-manifest.json')continue;
 files.push({path,sha256:createHash('sha256').update(readFileSync(full)).digest('hex')});
}}
walk(root);files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
writeFileSync(join(root,'security/file-manifest.json'),JSON.stringify({version:1,algorithm:'sha256',note:'Review aid only. Do not regenerate to silence a failure without reviewing every changed file. This manifest excludes itself; use a trusted pinned release/checksum for distribution integrity.',files},null,2)+'\n');
console.log(`Recorded ${files.length} files. Review the source and manifest diff before merging.`);
