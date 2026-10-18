import { readdir, readFile, mkdir, writeFile, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// Only downloads asset URLs returned by the inspected Figma MCP contexts.
const run = promisify(execFile);
const root = process.cwd();
const refs = path.join(root, 'design-reference');
const cache = path.join(root, 'public/assets/shared');
await mkdir(cache, { recursive: true });
const manifest = {};
const downloads = new Map();
for (const filename of await readdir(refs)) {
  if (!filename.endsWith('.txt')) continue;
  const text = await readFile(path.join(refs, filename), 'utf8');
  const prefix = text.match(/const assetPathPrefix = "([^"]+)"/)?.[1];
  if (!prefix) continue;
  const folder = filename.replace(/\.txt$/, '');
  manifest[folder] = {};
  for (const match of text.matchAll(/const (\w+) = `\$\{assetPathPrefix\}\/([^`]+)`/g)) {
    const [, variable, asset] = match;
    if (!/^[\w.-]+\.(svg|png|jpe?g|webp|gif)$/i.test(asset)) continue;
    manifest[folder][variable] = `/assets/${folder}/${asset}`;
    if (!downloads.has(asset)) downloads.set(asset, { url: `${prefix}/${asset}`, folders: new Set() });
    downloads.get(asset).folders.add(folder);
  }
}
const queue = [...downloads];
let completed = 0;
await Promise.all(Array.from({ length: Math.min(8, queue.length) }, async () => {
  while (queue.length) {
    const [asset, item] = queue.shift();
    const destination = path.join(cache, asset);
    let exists = false;
    try { exists = (await stat(destination)).size > 0; } catch {}
    if (!exists) await run('curl.exe', ['-f', '-L', '--retry', '2', '--silent', '--show-error', item.url, '-o', destination]);
    for (const folder of item.folders) {
      await mkdir(path.join(root, 'public/assets', folder), { recursive: true });
      await copyFile(destination, path.join(root, 'public/assets', folder, asset));
    }
    completed++;
  }
}));
await mkdir(path.join(root, 'src/data'), { recursive: true });
await writeFile(path.join(root, 'src/data/design-assets.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Verified ${completed} original Figma assets across ${Object.keys(manifest).length} inspected frame contexts.`);
