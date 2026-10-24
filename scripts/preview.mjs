import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.mp4':'video/mp4'};
http.createServer((req,res)=>{
 try {
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep) && file!==root) {res.writeHead(403);res.end();return;}
  if(fs.statSync(file).isDirectory()) {
   if(!new URL(req.url,'http://localhost').pathname.endsWith('/')) {res.writeHead(301,{Location:new URL(req.url,'http://localhost').pathname+'/'+new URL(req.url,'http://localhost').search});res.end();return;}
   file=path.join(file,'index.html');
  }
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
 } catch {res.writeHead(404);res.end('Not found');}
}).listen(Number(process.argv[2] || 8080),'127.0.0.1',function () { console.log(`Local: http://localhost:${this.address().port}/en/`); });
