/**
 * File:        tools/serve.js
 * What it is:  A tiny local web server for development (no packages needed).
 * What it does:
 *   Serves this folder at http://localhost:8080 so the ES modules load.
 *     npm start            (or: node tools/serve.js 8080)
 *   For real hosting, upload the folder to any static host instead
 *   (GitHub Pages, Netlify, a school server). This file is not needed there.
 * Depends on:  Node.js only.
 */

import { createServer } from 'node:http';
import { readFile, stat, open } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = normalize(join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const fileStat = await stat(file);
    if (!fileStat.isFile()) throw new Error('not a file');
    const contentType = TYPES[extname(file)] ?? 'application/octet-stream';
    const totalSize = fileStat.size;

    const rangeHeader = req.headers.range;
    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize || start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` }).end();
        return;
      }

      const chunkSize = end - start + 1;
      const fileHandle = await open(file, 'r');
      const buffer = Buffer.alloc(chunkSize);
      await fileHandle.read(buffer, 0, chunkSize, start);
      await fileHandle.close();

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });
      res.end(buffer);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': totalSize,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => console.log(`6DotsLab running at http://localhost:${PORT}`));
