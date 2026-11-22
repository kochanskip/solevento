import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=[path.join(root,'index.html'),...['en','pt'].flatMap(l=>walk(path.join(root,l))).filter(f=>f.endsWith('.html'))];
const local=(url,file)=>{const u=new URL(url,'https://soleventoceramics.com/'+path.relative(root,file).split(path.sep).join('/'));if(u.origin!=='https://soleventoceramics.com')return null;return path.join(root,decodeURIComponent(u.pathname),u.pathname.endsWith('/')?'index.html':'');};
const errors=[];let links=0;
for(const file of files){
 const html=fs.readFileSync(file,'utf8'),label=path.relative(root,file);
 if(html.includes('{{'))errors.push(`${label}: unresolved template`);
 for(const m of html.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)){
  if(/^(?:mailto:|tel:|data:|#|javascript:)/i.test(m[1]))continue;
  const target=local(m[1],file);if(target){links++;if(!fs.existsSync(target))errors.push(`${label}: missing ${m[1]}`);}
 }
 for(const m of html.matchAll(/\bsrcset="([^"]+)"/g))for(const entry of m[1].split(',')){const target=local(entry.trim().split(/\s+/)[0],file);if(target&&!fs.existsSync(target))errors.push(`${label}: missing srcset ${entry}`);}
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){try{new vm.Script(m[1],{filename:label});}catch(e){errors.push(e.message);}}
 if(file===path.join(root,'index.html'))continue;
 const lang=label.split(path.sep)[0];
 if(!html.includes(`<html lang="${lang==='pt'?'pt-PT':'en'}">`))errors.push(`${label}: wrong language`);
 if((html.match(/rel="canonical"/g)||[]).length!==1)errors.push(`${label}: expected one canonical link`);
 const switcher=html.match(/<nav class="language-switcher"[\s\S]*?<\/nav>/)?.[0];
 if(!switcher){errors.push(`${label}: missing language switcher`);continue;}
 for(const m of switcher.matchAll(/href="([^"]+)"/g)){
  const target=local(m[1],file);if(!target||!fs.existsSync(target))continue;
  const other=fs.readFileSync(target,'utf8').match(/<nav class="language-switcher"[\s\S]*?<\/nav>/)?.[0]||'';
  if(![...other.matchAll(/href="([^"]+)"/g)].some(link=>local(link[1],target)===file))errors.push(`${label}: language switcher does not link back from ${m[1]}`);
 }
}
for(const error of errors)console.error(error);
console.log(`Checked ${files.length} editable HTML pages and ${links} local links/assets; ${errors.length} errors.`);
if(errors.length)process.exitCode=1;