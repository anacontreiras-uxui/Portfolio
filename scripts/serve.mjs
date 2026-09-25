import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4', '.ttf': 'font/ttf', '.pdf': 'application/pdf' };
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '0.0.0.0';
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep) || pathname.split('/').some(part => part.startsWith('.')) || pathname.includes('node_modules')) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const fileStat = await stat(file);
    if (!fileStat.isFile()) throw new Error('Not a file');
    if (extname(file) === '.mp4') {
      const size = fileStat.size;
      const range = req.headers.range;
      let start = 0;
      let end = size - 1;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match || (!match[1] && !match[2])) {
          res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
          return;
        }
        if (match[1]) {
          start = Number(match[1]);
          if (match[2]) end = Number(match[2]);
        } else {
          start = Math.max(0, size - Number(match[2]));
        }
        if (start > end || start >= size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
          res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
          return;
        }
        end = Math.min(end, size - 1);
      }
      res.writeHead(range ? 206 : 200, {
        'Content-Type': 'video/mp4',
        'Content-Length': end - start + 1,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
        ...(range ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
      });
      createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Página não encontrada.');
  }
}).listen(port, host, () => {
  console.log(`Portfolio: http://localhost:${port}`);
  if (host === '0.0.0.0') {
    for (const address of Object.values(networkInterfaces()).flat()) {
      if (address.family === 'IPv4' && !address.internal) {
        console.log(`Rede local: http://${address.address}:${port}`);
      }
    }
  }
});
