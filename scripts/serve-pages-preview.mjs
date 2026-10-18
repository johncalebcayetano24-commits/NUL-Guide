import http from 'node:http';
import { createReadStream } from 'node:fs';
import { access, realpath, stat, readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Deliberately has no SPA rewrite: missing clean routes receive the built 404.
const mount = '/NUL-Guide/';
const port = Number(process.env.PORT || 4183);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.');
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
await Promise.all([access(resolve(dist, 'index.html')), access(resolve(dist, '404.html'))]).catch(() => {
  throw new Error('Build the GitHub Pages output first: npm.cmd run build:pages');
});
const canonicalDist = await realpath(dist);
const insideDist = value => value === canonicalDist || value.startsWith(canonicalDist + sep);
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

function textResponse(request, response, status, message) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(message), 'Cache-Control': 'no-store' });
  response.end(request.method === 'HEAD' ? undefined : message);
}

async function notFound(request, response) {
  const body = await readFile(resolve(dist, '404.html'));
  response.writeHead(404, { 'Content-Type': mime['.html'], 'Content-Length': body.length, 'Cache-Control': 'no-store' });
  response.end(request.method === 'HEAD' ? undefined : body);
}

const server = http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      return textResponse(request, response, 405, 'Only GET and HEAD are supported.');
    }
    let url, pathname;
    try {
      url = new URL(request.url, 'http://127.0.0.1');
      pathname = decodeURIComponent(url.pathname);
    } catch { return textResponse(request, response, 400, 'Malformed request path.'); }
    if (pathname === mount.slice(0, -1)) {
      response.writeHead(308, { Location: mount + url.search, 'Cache-Control': 'no-store' });
      return response.end();
    }
    if (!pathname.startsWith(mount)) return textResponse(request, response, 404, 'This preview only serves /NUL-Guide/.');
    const relativePath = pathname.slice(mount.length) || 'index.html';
    if (/[\\\0:]/.test(relativePath)) return textResponse(request, response, 400, 'Invalid static file path.');
    const candidate = resolve(dist, relativePath);
    if (!(candidate === dist || candidate.startsWith(dist + sep))) return textResponse(request, response, 403, 'Path is outside the build directory.');
    let target, info;
    try {
      target = await realpath(candidate);
      if (!insideDist(target)) return textResponse(request, response, 403, 'Path is outside the build directory.');
      info = await stat(target);
    } catch (error) {
      if (['ENOENT', 'ENOTDIR'].includes(error.code)) return await notFound(request, response);
      throw error;
    }
    if (!info.isFile()) return await notFound(request, response);
    response.writeHead(200, { 'Content-Type': mime[extname(target).toLowerCase()] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store' });
    if (request.method === 'HEAD') return response.end();
    const stream = createReadStream(target);
    stream.on('error', error => response.destroy(error));
    stream.pipe(response);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) textResponse(request, response, 500, 'Static preview could not read the requested file.');
    else response.destroy(error);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`GitHub Pages static preview: http://127.0.0.1:${port}${mount}`);
  console.log(`Serving ${dist}; missing mounted files return 404.html with HTTP 404.`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
