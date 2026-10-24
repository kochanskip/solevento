import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {workshopImage} from './workshop-image.mjs';
import {formatHTML} from './format-html.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const readJSON = file => JSON.parse(read(file));
function portableURL(value,file) {
 const parsed = new URL(value,'https://soleventoceramics.com');
 const target = parsed.pathname.slice(1) + (parsed.pathname.endsWith('/')?'index.html':'');
 return (path.posix.relative(path.posix.dirname(file),target) || 'index.html') + parsed.search + parsed.hash;
}
const write = (file,text) => {
 if(file.endsWith('.html')) {
  // Relative paths and explicit index files also work when opened with file://.
  text=text.replace(/\b(href|src|poster)="(\/[^\"]*)"/g,(_,attr,value)=>`${attr}="${portableURL(value,file)}"`);
  text=text.replace(/\bsrcset="([^\"]*)"/g,(_,value)=>'srcset="'+value.replace(/\/[^\s,]+/g,url=>portableURL(url,file))+'"');
  text=text.replace(/(content="0;url=)(\/[^\"]*)/g,(_,prefix,value)=>prefix+portableURL(value,file));
  // Compatibility redirect targets are JSON string literals in inline scripts.
  text=text.replace(/"(\/(?:en|pt)\/[^\"]*)"/g,(_,value)=>JSON.stringify(portableURL(value,file)));
  text=formatHTML(text);
 }
 text=text.replace(/\r?\n/g,'\r\n');
 const dest=path.join(root,file); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.writeFileSync(dest,text);
};
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const origin = 'https://soleventoceramics.com';
const languages = ['en','pt'];
const routes = readJSON('content/pages/routes.json');
const shared = readJSON('content/events/workshops.json');
const text = Object.fromEntries(languages.map(lang=>[lang,readJSON(`content/events/workshops.${lang}.json`)]));
const ui = {
 en:{locale:'en-GB',language:'Language',private:'Private',group:'Group',individual:'Scheduled individually',from:'Available from',hour:'hour',hours:'hours',date:'Date',duration:'Duration',back:'All workshops',book:'Book by Email',subject:'Booking: ',payment:'Payment will not be taken until after the session. To attend one of our classes, please first check whether we have an available slot. This can be done by clicking below or by emailing <strong>solevento.ceramics@gmail.com</strong>. We hope to see you soon!'},
 pt:{locale:'pt-PT',language:'Idioma',private:'Individual',group:'Grupo',individual:'A combinar individualmente',from:'Disponível a partir de',hour:'hora',hours:'horas',date:'Data',duration:'Duração',back:'Todos os workshops',book:'Reservar por email',subject:'Reserva: ',payment:'O pagamento será efetuado após a sessão. Para participar numa das nossas aulas, confirme primeiro se temos uma vaga disponível. Pode fazê-lo através do botão abaixo ou por email para <strong>solevento.ceramics@gmail.com</strong>. Esperamos vê-lo em breve!'}
};

// Fail before writing anything if content is incomplete or inconsistent.
const ids = new Set();
for(const w of shared) {
 if(ids.has(w.id)) throw new Error(`Duplicate workshop ID ${w.id}`);
 ids.add(w.id);
 if(!['private','group'].includes(w.category) || !Number.isFinite(w.price) || !Number.isInteger(w.durationMinutes) || !Number.isInteger(w.sessions)) throw new Error(`Invalid shared fields for ${w.id}`);
 if(!fs.existsSync(path.join(root,w.image.slice(1)))) throw new Error(`Missing image ${w.image}`);
 if(!['individual','from-date'].includes(w.scheduling) || (w.scheduling==='from-date' && !/^\d{4}-\d{2}-\d{2}$/.test(w.availableFrom))) throw new Error(`Invalid scheduling for ${w.id}`);
 for(const lang of languages) {
  const t=text[lang][w.id];
  for(const field of ['slug','title','description','longDescription','requirements']) if(!t?.[field]) throw new Error(`Missing ${lang}.${w.id}.${field}`);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.slug)) throw new Error(`Invalid slug ${t.slug}`);
  const localizedImage=workshopImage(w,t);
  if(typeof localizedImage!=='string' || !localizedImage.startsWith('/') || localizedImage.startsWith('//') || !fs.existsSync(path.join(root,localizedImage.slice(1)))) throw new Error(`Invalid or missing ${lang} image for workshop ${w.id}: ${localizedImage}`);
 }
}
for(const lang of languages) {
 const slugs=shared.map(w=>text[lang][w.id].slug);
 if(new Set(slugs).size!==slugs.length) throw new Error(`Duplicate ${lang} slug`);
 if(Object.keys(text[lang]).some(id=>!ids.has(Number(id)))) throw new Error(`Unknown ID in ${lang} translations`);
}

const url = (lang,route) => `/${lang}/${route==='index.html'?'':route}`;
const workshopRoute = (lang,id) => `workshops/${text[lang][id].slug}/`;
const workshopURL = (lang,id) => url(lang,workshopRoute(lang,id));
const money = (lang,w) => new Intl.NumberFormat(ui[lang].locale,{style:'currency',currency:w.currency,maximumFractionDigits:0}).format(w.price);
const date = (lang,w) => w.scheduling==='individual'?ui[lang].individual:`${ui[lang].from} ${new Intl.DateTimeFormat(ui[lang].locale,{timeZone:'UTC'}).format(new Date(w.availableFrom+'T00:00:00Z'))}`;
const duration = (lang,w) => {
 const hours=w.durationMinutes/60;
 return `${new Intl.NumberFormat(ui[lang].locale).format(hours)} ${hours===1?ui[lang].hour:ui[lang].hours}${w.sessions>1?` (×${w.sessions})`:''}`;
};
function card(lang,w,classes='col-md-4 product-card') {
 const t=text[lang][w.id];
 return `<div class="${classes}"><div class="workshops-item card h-100 shadow-sm"><a href="${workshopURL(lang,w.id)}"><img src="${escape(workshopImage(w,t))}" class="product-image card-img-top" alt="${escape(t.title)}" loading="lazy"><div class="card-body"><div class="d-flex justify-content-between align-items-start gap-3"><h5 class="card-title mb-0">${escape(t.title)}</h5><span class="text-nowrap">${escape(money(lang,w))}</span></div><p class="card-text mt-2">${escape(date(lang,w))}</p><p class="card-text">${escape(t.description)}</p></div></a></div></div>`;
}
function details(lang,w) {
 const t=text[lang][w.id], labels=ui[lang];
 return `<section class="workshop-section py-3"><div class="container"><a class="d-inline-block mb-3" href="/${lang}/workshops.html">← ${labels.back}</a><div id="workshop-detail" class="row justify-content-center"><div class="col-12"><div class="row align-items-stretch"><div class="col-md-6 text-center mb-4 mb-md-0"><img src="${escape(workshopImage(w,t))}" alt="${escape(t.title)}" class="img-fluid craft-image"></div><div class="col-md-6"><div class="p-2 h-100 d-flex flex-column justify-content-start"><h1 class="product-title h4">${escape(t.title)}</h1><div class="content"><p>${escape(t.longDescription)}</p>${t.longDescriptionList?.length?`<ul>${t.longDescriptionList.map(item=>`<li>${escape(item)}</li>`).join('')}</ul>`:''}<p>${escape(t.requirements)}</p><p><strong>${labels.date}:</strong> ${escape(date(lang,w))}<br><strong>${labels.duration}:</strong> ${escape(duration(lang,w))}</p></div><h2 class="product-price h4">${escape(money(lang,w))}</h2><p class="product-alert alert alert-info">${labels.payment}</p><div class="btn-container"><a href="mailto:solevento.ceramics@gmail.com?subject=${encodeURIComponent(labels.subject+t.title)}" class="btn email-btn btn-block">${labels.book}</a></div></div></div></div></div></div></div></section>`;
}
function decorate(html,lang,route,workshopId) {
 html=html.replaceAll('{{lang}}',lang);
 if(route.startsWith('products/')) {
  const shopSource=read(`content/pages/${lang}/shop.html`);
  const options=[...shopSource.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)];
  html=html.replace(/(<h[1-6]\b[^>]*class="product-title"[^>]*>)([\s\S]*?)(<\/h[1-6]>)/,(_,start,title,end)=>{
   const parts=title.trim().split(/\s+\/\s+/);
   if(parts.length!==2) throw new Error(`Expected collection / item title in ${lang}/${route}`);
   const option=options.find(m=>m[2]===parts[0]);
   if(!option) throw new Error(`Unknown collection ${parts[0]} in ${lang}/${route}`);
   return `${start}<a class="product-collection-link" href="/${lang}/shop.html?collection=${encodeURIComponent(option[1])}">${escape(parts[0])}</a><span class="product-item-name">${escape(parts[1])}</span>${end}`;
  });
 }
 const equivalent=target=>workshopId?workshopURL(target,workshopId):url(target,route);
 const current=equivalent(lang);
 const seo=`<link rel="canonical" href="${origin+current}">\n${languages.map(l=>`<link rel="alternate" hreflang="${l==='pt'?'pt-PT':'en'}" href="${origin+equivalent(l)}">`).join('\n')}\n<link rel="alternate" hreflang="x-default" href="${origin+equivalent('en')}">`;
 html=html.replace('</head>',seo+'\n</head>');
 const switcher=`<nav class="language-switcher" aria-label="${ui[lang].language}"><div class="dropdown"><button class="language-dropdown-toggle dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="${ui[lang].language}: ${lang==='en'?'English':'Português'}">${lang==='en'?'English':'Português'}</button><ul class="dropdown-menu dropdown-menu-end">${languages.map(l=>`<li><a class="dropdown-item${l===lang?' active':''}" href="${equivalent(l)}" lang="${l==='pt'?'pt-PT':'en'}" hreflang="${l==='pt'?'pt-PT':'en'}"${l===lang?' aria-current="page"':''}>${l==='en'?'English':'Português'}</a></li>`).join('')}</ul></div></nav>`;
 // Keep the desktop dropdown in the links' flex row so they share alignment.
 html=html.replace(/(<div class="collapse navbar-collapse[\s\S]*?<ul class="nav ms-auto">)([\s\S]*?)(<\/ul>)/,(_,start,items,end)=>`${start}${items}<li class="nav-item language-nav-item">${switcher}</li>${end}`);
 const mobileSwitcher=switcher.replace('class="language-switcher"','class="language-switcher language-switcher-mobile d-md-none"');
 html=html.replace(/(\s*)<div class="collapse navbar-collapse/,`\n${mobileSwitcher}$1<div class="collapse navbar-collapse`);
 // Repair old mobile active states consistently with the current page.
 const section=workshopId?'workshops.html':route;
 html=html.replace(/<a class="nav-link(?: active)?" href="([^"]+)">/g,(_,href)=>`<a class="nav-link${href===`/${lang}/${section}`?' active':''}" href="${href}"${href===`/${lang}/${section}`?' aria-current="page"':''}>`);
 html=html.replace(/(<button class="navbar-toggler"[^>]*)(>)/g,(_,attrs,end)=>attrs.includes('aria-label')?attrs+end:attrs+` aria-label="${lang==='pt'?'Abrir menu':'Toggle navigation'}"`+end);
 html=html.replace(/<button type="button" class="btn-close" data-bs-dismiss="offcanvas"><\/button>/g,`<button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="${lang==='pt'?'Fechar menu':'Close menu'}"></button>`);
 html=html.replace(/<iframe src=/g,`<iframe title="${lang==='pt'?'Localização do atelier':'Studio location'}" src=`);
 html=html.replace('id="searchProducts"',`aria-label="${lang==='pt'?'Pesquisar produtos':'Search products'}" id="searchProducts"`).replace('id="collectionFilter"',`aria-label="${lang==='pt'?'Filtrar por coleção':'Filter by collection'}" id="collectionFilter"`).replace('id="sortProducts"',`aria-label="${lang==='pt'?'Ordenar produtos':'Sort products'}" id="sortProducts"`);
 if(/\{\{\w+}}/.test(html)) throw new Error(`Unresolved placeholder in ${lang}/${route}`);
 return html;
}
// Keep all product sources while controlling which collections appear in the shop.
const shopCollections = new Set(readJSON('content/pages/shop-collections.json'));
const hiddenShopProducts = readJSON('content/pages/hidden-shop-products.json');
const productImagesPath='content/pages/product-images.json';
const productImages=fs.existsSync(path.join(root,productImagesPath))?readJSON(productImagesPath):{routes:[],images:{}};
function productDisplayImages(html,route) {
 if(!productImages.routes.includes(route)) return html;
 html=html.replace(/<img\b[^>]*>/g,tag=>{
  const thumb=/class="[^"]*product-thumb/.test(tag);
  if(!thumb && !/class="[^"]*product-detail-image/.test(tag))return tag;
  const src=tag.match(/\bsrc="([^"]+)"/)?.[1];
  const target=productImages.images[src]?.[thumb?160:1200];
  if(!target || !fs.existsSync(path.join(root,target.slice(1))))return tag;
  tag=tag.replace(/\bsrc="[^"]+"/,`src="${target}"`);
  if(!/\bdecoding=/.test(tag))tag=tag.replace(/>$/,' decoding="async">');
  return tag;
 });
 html=html.replace(/\bposter="([^"]+)"/g,(attr,src)=>productImages.images[src]?.[1200]?`poster="${productImages.images[src][1200]}"`:attr);
 html=html.replace(/<link\b[^>]*rel="preload"[^>]*>/g,tag=>{
  const src=tag.match(/\bhref="([^"]+)"/)?.[1],variants=productImages.images[src];
  const target=variants?.[1200]||variants?.[160];
  return target?tag.replace(/href="[^"]+"/,`href="${target}"`).replace(/type="image\/[^"]+"/,'type="image/webp"'):tag;
 });
 return html;
}
function shopImages(html) {
 return html.replace(/<img\b[^>]*>/g,tag=>{
  if(!/class="[^"]*\bproduct-image\b/.test(tag)) return tag;
  const src=tag.match(/\bsrc="([^"]+)"/)?.[1];
  if(!src?.startsWith('/images/Products/')) return tag;
  const base='/images/shop/'+src.slice('/images/Products/'.length);
  if(![480,960].every(width=>fs.existsSync(path.join(root,`${base.slice(1)}.${width}.webp`)))) return tag;
  tag=tag.replace(/\s+(?:loading|decoding|width|height|srcset|sizes)="[^"]*"/g,'');
  return tag.replace(/\bsrc="[^"]+"/,`src="${base}.480.webp" srcset="${base}.480.webp 480w, ${base}.960.webp 960w" sizes="(min-width: 1400px) 416px, (min-width: 1200px) 356px, (min-width: 992px) 296px, (min-width: 768px) 216px, (min-width: 576px) 516px, calc(100vw - 24px)" width="480" height="360" loading="lazy" decoding="async"`);
 });
}
function availableShop(html) {
 const cards=[...html.matchAll(/<div\b[^>]*class="col-md-4 product-card"[^>]*>/g)];
 for(const card of cards.reverse()) {
  const collection=card[0].match(/data-collection="([^"]+)"/)?.[1];
  const nextCard=html.indexOf('<div class="col-md-4 product-card"',card.index+card[0].length);
  const cardContent=html.slice(card.index,nextCard<0?html.length:nextCard);
  const hidden=hiddenShopProducts.some(route=>cardContent.includes(`href="/{{lang}}/${route}"`));
  if(shopCollections.has(collection) && !hidden) continue;
  let depth=1, end=card.index+card[0].length;
  const tags=/<\/?div\b[^>]*>/g;
  tags.lastIndex=end;
  for(let tag; depth && (tag=tags.exec(html));) {
   depth+=tag[0].startsWith('</')?-1:1;
   end=tags.lastIndex;
  }
  if(depth) throw new Error('Unbalanced shop card');
  html=html.slice(0,card.index)+html.slice(end);
 }
 return html.replace(/(<select id="collectionFilter"[^>]*>)([\s\S]*?)(<\/select>)/,(_,start,options,end)=>start+options.replace(/<option value="([^"]*)">[^<]*<\/option>/g,(option,value)=>!value || shopCollections.has(value)?option:'')+end);
}
const generated=[];
for(const lang of languages) {
 for(const route of routes) {
  let html=read(`content/pages/${lang}/${route}`);
  html=html.replace('{{privateCards}}',shared.filter(w=>w.category==='private').map(w=>card(lang,w)).join('\n')).replace('{{groupCards}}',shared.filter(w=>w.category==='group').map(w=>card(lang,w)).join('\n'));
  html=html.replace('{{workshopCarousel}}',shared.map((w,i)=>`<div class="carousel-item${i===0?' active':''}"><div class="row g-4 justify-content-center">${card(lang,w,'col-12 col-md-6 col-lg-4 workshop-carousel-card')}</div></div>`).join('\n'));
  write(`${lang}/${route}`,decorate(route === 'shop.html' ? shopImages(availableShop(html)) : productDisplayImages(html,route),lang,route));
  generated.push(url(lang,route));
 }
 for(const w of shared) {
  const t=text[lang][w.id];
  let html=read(`content/pages/${lang}/workshop.html`).replace('{{workshopDetail}}',details(lang,w));
  html=html.replace(/<title>[^<]*<\/title>/,`<title>${escape(t.title)} | Solevento Ceramics</title>`).replace(/(<meta name="description" content=")[^"]*(">)/,(_,a,b)=>a+escape(t.description)+b);
  write(`${lang}/${workshopRoute(lang,w.id)}index.html`,decorate(html,lang,workshopRoute(lang,w.id),w.id));
  generated.push(workshopURL(lang,w.id));
 }
}
// Keep the bare domain opening the English homepage; omit old URL redirects.
write('index.html',`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Solevento Ceramics</title><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=/en/index.html"><link rel="canonical" href="https://soleventoceramics.com/en/"></head><body><script>location.replace("/en/index.html"+location.search+location.hash);</script><p><a href="/en/index.html">Continue to Solevento Ceramics</a></p></body></html>`);
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${generated.map(u=>`  <url><loc>${origin+escape(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Built ${generated.length} localized pages, homepage redirect and sitemap.`);
