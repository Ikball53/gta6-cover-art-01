// Tiny static file server for local preview of app/ on port 8080. Dev tool only.

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const appDir = join(import.meta.dirname ?? '.', 'app');
const port = 8080;

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
  const rel = normalize(urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, ''));
  const filePath = join(appDir, rel);
  if (!filePath.startsWith(appDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(filePath).toLowerCase()] ?? 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`Vice Cover Maker preview at http://localhost:${port}/`);
});
