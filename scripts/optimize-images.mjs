import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const absolute=url=>path.join(root,url.slice(1));
const relative=(file,url)=>path.relative(path.dirname(file),absolute(url)).split(path.sep).join('/');
function original(url){
 if(url.startsWith('/images/shop/'))url='/images/Products/'+url.slice('/images/shop/'.length).replace(/\.(480|960)\.webp$/,'');
 else url=url.replace(/\/(160|480|960|1200)\/([^/]+)\.webp$/,'/$2');
 if(!fs.existsSync(absolute(url))){
  const fallback=url.replace(/\/110\//,'/');
  if(fs.existsSync(absolute(fallback)))url=fallback;
 }
 if(!url.startsWith('/images/Products/'))throw Error(`Not a product image: ${url}`);
 return url;
}
export async function optimizeImages(mode){
 const sharp=createRequire(import.meta.url)('sharp'),jobs=new Map(),pages=new Map();
 const urlFor=(value,file)=>decodeURIComponent(new URL(value,'https://soleventoceramics.com/'+path.relative(root,file).split(path.sep).join('/')).pathname);
 const target=(src,width)=>path.posix.dirname(src).replace(/\/110$/,'')+`/${width}/`+path.posix.basename(src)+'.webp';
 const add=(value,file,width)=>{const src=original(urlFor(value,file)),dest=target(src,width);jobs.set(dest,{src,width});return relative(file,dest);};
 for(const lang of ['en','pt']){
  const shopFile=path.join(root,lang,'shop.html'),shop=fs.readFileSync(shopFile,'utf8');
  const files=mode==='shop'?[shopFile]:[...new Set([...shop.matchAll(/href="([^"?#]+\.html)"/g)].map(m=>urlFor(m[1],shopFile)).filter(u=>u.includes('/products/')).map(absolute))];
  for(const file of files){
   let html=fs.readFileSync(file,'utf8');
   html=html.replace(/<img\b[^>]*>/g,tag=>{
    const thumb=/class="[^"]*\bproduct-thumb\b/.test(tag);
    if(mode==='shop'?!/class="[^"]*\bproduct-image\b/.test(tag):!thumb&&!/class="[^"]*\bproduct-detail-image\b/.test(tag))return tag;
    const src=tag.match(/\bsrc="([^"]+)"/)?.[1];if(!src)return tag;
    if(mode==='shop'){
     const small=add(src,file,480),large=add(src,file,960);
     tag=tag.replace(/\s+(srcset|sizes|width|height|loading|decoding)="[^"]*"/g,'');
     return tag.replace(/\bsrc="[^"]+"/,`src="${small}" srcset="${small} 480w, ${large} 960w" sizes="(min-width: 1200px) 416px, (min-width: 768px) 33vw, 100vw" width="480" height="360" loading="lazy" decoding="async"`);
    }
    return tag.replace(/\bsrc="[^"]+"/,`src="${add(src,file,thumb?160:1200)}"`);
   });
   if(mode!=='shop'){
    html=html.replace(/\bposter="([^"]+)"/g,(tag,value)=>`poster="${add(value,file,1200)}"`);
    html=html.replace(/<link\b[^>]*rel="preload"[^>]*>/g,tag=>{
     const href=tag.match(/href="([^"]+)"/)?.[1];if(!href||!urlFor(href,file).startsWith('/images/Products/'))return tag;
     return tag.replace(/href="[^"]+"/,`href="${add(href,file,1200)}"`).replace(/type="image\/[^"]+"/,'type="image/webp"');
    });
   }
   pages.set(file,html);
  }
 }
 // Validate every original before changing any HTML.
 const hashes=new Map();
 for(const {src}of jobs.values()){const data=fs.readFileSync(absolute(src));hashes.set(src,crypto.createHash('sha256').update(data).digest('hex'));}
 for(const [dest,{src,width}]of jobs){
  let pipeline=sharp(absolute(src)).rotate();
  pipeline=mode==='shop'?pipeline.resize(width,width*3/4,{fit:'cover'}):pipeline.resize({width,height:width,fit:'inside',withoutEnlargement:true});
  fs.mkdirSync(path.dirname(absolute(dest)),{recursive:true});
  await pipeline.webp({quality:width===160?75:82}).toFile(absolute(dest));
 }
 for(const [src,hash]of hashes)if(crypto.createHash('sha256').update(fs.readFileSync(absolute(src))).digest('hex')!==hash)throw Error(`Original changed: ${src}`);
 for(const [file,html]of pages)fs.writeFileSync(file,html.replace(/\r?\n/g,'\r\n'));
 console.log(`Optimized ${jobs.size} ${mode} images; updated ${pages.size} HTML pages directly. Originals unchanged.`);
}
