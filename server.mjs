import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('.',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png'};
const port=Number(process.env.PORT||5173);
createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(root,'.'+pathname);
  if((path!==root&&!path.startsWith(root+sep))||pathname.startsWith('/api/')||pathname.startsWith('/.')){res.writeHead(404);res.end('Not found');return;}
  const target=(await stat(path)).isDirectory()?resolve(path,'index.html'):path;
  const data=await readFile(target);
  res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found')}
}).listen(port,()=>console.log(`SopaLens → http://localhost:${port}`));
