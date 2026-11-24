import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {formatHTML} from './format-html.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=[path.join(root,'index.html'),...['en','pt'].flatMap(l=>walk(path.join(root,l))).filter(f=>f.endsWith('.html'))];
const raw=s=>[...s.matchAll(/<(script|style|pre|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi)].map(m=>m[0]);
let changed=0;
for(const file of files){
 const original=fs.readFileSync(file,'utf8');
 const formatted=formatHTML(original).replace(/\r?\n/g,'\r\n');
 assert.deepEqual(raw(formatted),raw(original),`Protected content changed: ${file}`);
 // Formatting may change whitespace, never tags, attributes or wording.
 assert.equal(formatted.replace(/\s/g,''),original.replace(/\s/g,''),`HTML content changed: ${file}`);
 if(formatted!==original){fs.writeFileSync(file,formatted);changed++;}
}
console.log(`Formatted ${changed} of ${files.length} HTML pages; wording, markup and protected blocks verified.`);
