import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {workshopImage} from './workshop-image.mjs';
assert.equal(workshopImage({image:'/shared.webp'},{}),'/shared.webp');
assert.equal(workshopImage({image:'/shared.webp'},{image:'/portuguese.webp'}),'/portuguese.webp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=['en','pt'].flatMap(lang=>walk(path.join(root,lang))).filter(f=>f.endsWith('.html'));
const localFile=(url,from=path.join(root,'index.html'))=>{const base='https://soleventoceramics.com/'+path.relative(root,from).split(path.sep).join('/');let file=path.join(root,decodeURIComponent(new URL(url,base).pathname));return file.endsWith(path.sep)?path.join(file,'index.html'):file;};
let links=0;
for(const file of files) {
 const html=fs.readFileSync(file,'utf8');
 assert(!html.includes('{{'),`Unresolved template: ${file}`);
 for(const match of html.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)) {
  const href=match[1];
  if(!/^(?:[a-z]+:|#)/i.test(href) || href.startsWith('https://soleventoceramics.com/')) {assert(fs.existsSync(localFile(href,file)),`Broken link in ${path.relative(root,file)}: ${href}`);links++;}
 }
 for(const match of html.matchAll(/\bsrcset="([^"]+)"/g)) for(const entry of match[1].split(',')) assert(fs.existsSync(localFile(entry.trim().split(/\s+/)[0],file)),`Broken srcset in ${file}: ${entry}`);
 for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1],{filename:file});
 if(html.includes('noindex,follow')) continue;
 const lang=path.relative(root,file).split(path.sep)[0];
 assert(html.includes(`<html lang="${lang==='pt'?'pt-PT':'en'}">`),`Wrong language ${file}`);
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 assert(html.includes('hreflang="en"') && html.includes('hreflang="pt-PT"'));
 assert.equal((html.match(/class="language-switcher"/g)||[]).length,1);
 const switcher=html.match(/<nav class="language-switcher"[\s\S]*?<\/nav>/)[0];
 for(const match of switcher.matchAll(/href="([^"]+)"/g)) {
  const targetFile=localFile(match[1],file);
  const target=fs.readFileSync(targetFile,'utf8');
  const current=html.match(/rel="canonical" href="https:\/\/soleventoceramics.com([^"]+)"/)[1];
  const targetSwitcher=target.match(/<nav class="language-switcher"[\s\S]*?<\/nav>/)[0];
  assert([...targetSwitcher.matchAll(/href="([^"]+)"/g)].some(m=>localFile(m[1],targetFile)===file),`Missing reciprocal switcher: ${file}`);
 }
 if(lang==='pt') assert(!/>\s*(Home|Shop|About|Contact|Private Sessions|Group Classes|Send email|View all)\s*</.test(html),`English UI in ${file}`);
 if(file.includes(path.sep+'workshops'+path.sep)) assert(html.includes('id="workshop-detail"') && html.includes('<h1'),`Missing static workshop detail ${file}`);
 assert(!html.includes('fetch('),`Unexpected workshop fetch ${file}`);
}
const shared=JSON.parse(fs.readFileSync(path.join(root,'content/events/workshops.json'),'utf8'));
for(const lang of ['en','pt']) {
 const text=JSON.parse(fs.readFileSync(path.join(root,`content/events/workshops.${lang}.json`),'utf8'));
 for(const w of shared) {
  const expectedImage=path.join(root,workshopImage(w,text[w.id]).slice(1));
  for(const page of [`${lang}/index.html`,`${lang}/workshops.html`,`${lang}/workshops/${text[w.id].slug}/index.html`]) {
   const pageFile=path.join(root,page);
   const content=fs.readFileSync(pageFile,'utf8');
   assert([...content.matchAll(/<img\b[^>]*src="([^"]+)"/g)].some(m=>localFile(m[1],pageFile)===expectedImage),`Workshop image missing in ${page}`);
   assert(!/(?<!\r)\n/.test(content),`Non-CRLF line endings in ${page}`);
  }
 }

}
console.log(`Checked ${files.length} pages, ${links} local links/assets, JavaScript syntax, reciprocal language links.`);
