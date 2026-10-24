import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// Run with Sharp installed, or NODE_PATH pointing to a runtime that provides it.
const sharp=createRequire(import.meta.url)('sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sources=new Set();
for(const lang of ['en','pt']) {
 const html=fs.readFileSync(path.join(root,`content/pages/${lang}/shop.html`),'utf8');
 for(const match of html.matchAll(/<img\b[^>]*>/g)) {
  if(!/class="[^"]*\bproduct-image\b/.test(match[0])) continue;
  const src=match[0].match(/\bsrc="([^"]+)"/)?.[1];
  if(src?.startsWith('/images/Products/')) sources.add(src);
 }
}
let originalBytes=0, smallBytes=0, largeBytes=0;
for(const src of sources) {
 const original=fs.readFileSync(path.join(root,src.slice(1)));
 const hash=crypto.createHash('sha256').update(original).digest('hex');
 originalBytes+=original.length;
 for(const width of [480,960]) {
  const target=path.join(root,'images/shop',src.slice('/images/Products/'.length)+`.${width}.webp`);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const result=await sharp(original).rotate().resize(width,width*3/4,{fit:'cover'}).webp({quality:80}).toBuffer();
  fs.writeFileSync(target,result);
  if(width===480)smallBytes+=result.length;else largeBytes+=result.length;
 }
 if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,src.slice(1)))).digest('hex')!==hash)throw new Error(`Original changed: ${src}`);
}
console.log(JSON.stringify({photos:sources.size,originalBytes,smallBytes,largeBytes,originalsUnchanged:true}));
