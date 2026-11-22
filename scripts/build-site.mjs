import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://soleventoceramics.com';
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
// HTML in en/ and pt/ is authoritative. This command NEVER writes HTML.
const urls=new Set();
for(const lang of ['en','pt'])for(const file of walk(path.join(root,lang)).filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync(file,'utf8');
 if(/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html))continue;
 const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
 if(canonical?.startsWith(origin+'/'))urls.add(canonical);
 else urls.add(origin+'/'+path.relative(root,file).split(path.sep).join('/'));
}
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s.replace(/\r?\n/g,'\r\n'));
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].sort().map(u=>`  <url><loc>${escape(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
const policy=JSON.parse(fs.readFileSync(path.join(root,'content/crawler-policy.json'),'utf8'));
write('robots.txt',`# AI crawler opt-outs; ordinary search crawling remains allowed.\n${policy.blockedAgents.map(a=>`User-agent: ${a}\nDisallow: /`).join('\n\n')}\n\nUser-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Updated sitemap (${urls.size} URLs) and robots.txt. All HTML files left untouched.`);