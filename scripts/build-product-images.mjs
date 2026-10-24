import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)('sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
// The built shop is the source of truth for which products are currently visible.
const shop=read('en/shop.html');
const routes=[...new Set([...shop.matchAll(/href="(products\/[^"?#]+\.html)"/g)].map(m=>m[1]))];
const manifest={routes,images:{}};
const sources=new Map();
for(const route of routes){
 const html=read(`content/pages/en/${route}`);
 for(const [tag] of html.matchAll(/<img\b[^>]*>/g)){
  if(!/class="[^"]*(?:product-detail-image|product-thumb)/.test(tag))continue;
  const src=tag.match(/\bsrc="([^"]+)"/)?.[1];
  if(!src?.startsWith('/images/'))continue;
  const width=/class="[^"]*product-thumb/.test(tag)?160:1200;
  if(!sources.has(src))sources.set(src,new Set());
  sources.get(src).add(width);
 }
}
let originalBytes=0,displayBytes=0;
for(const [src,widths]of sources){
 const file=path.join(root,src.slice(1)),original=fs.readFileSync(file),hash=crypto.createHash('sha256').update(original).digest('hex');
 originalBytes+=original.length;
 manifest.images[src]={};
 for(const width of widths){
  const target='/images/product-display/'+src.slice('/images/'.length)+`.${width}.webp`;
  const data=await sharp(original).rotate().resize({width,height:width,fit:'inside',withoutEnlargement:true}).webp({quality:width===160?75:82}).toBuffer();
  fs.mkdirSync(path.dirname(path.join(root,target.slice(1))),{recursive:true});fs.writeFileSync(path.join(root,target.slice(1)),data);
  manifest.images[src][width]=target;displayBytes+=data.length;
 }
 if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==hash)throw Error(`Original changed: ${src}`);
}
fs.writeFileSync(path.join(root,'content/pages/product-images.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({products:routes.length,sourceImages:sources.size,originalBytes,displayBytes,originalsUnchanged:true}));
