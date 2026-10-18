import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { assetPath } from '../src/utils/assetPath.js';
import { pagesFallbackHtml, pagesFallbackPlugin } from '../scripts/pages-fallback.mjs';

test('public assets retain their original root path for local hosting', () => {
  assert.equal(assetPath('/assets/student-home/fa66b.svg', '/'), '/assets/student-home/fa66b.svg');
});
test('public assets resolve under a Pages repository path without a doubled slash', () => {
  assert.equal(assetPath('/assets/services-detail/ef079.svg', '/NUL-Guide/'), '/NUL-Guide/assets/services-detail/ef079.svg');
  assert.equal(assetPath('assets/logo.svg', '/NUL-Guide'), '/NUL-Guide/assets/logo.svg');
});
test('every original manifest asset is retained locally and resolves to the repository base', async () => {
  const manifest = JSON.parse(await readFile(new URL('../src/data/design-assets.json', import.meta.url), 'utf8'));
  const paths = Object.values(manifest).flatMap(page => Object.values(page));
  assert.equal(paths.length, 660);
  for (const path of paths) {
    assert.ok(assetPath(path, '/NUL-Guide/').startsWith('/NUL-Guide/assets/'));
    assert.ok((await stat(new URL(`../public${path}`, import.meta.url))).size > 0, path);
  }
});
test('Pages fallback preserves the configured base and query rather than a machine-specific URL', () => {
  const html = pagesFallbackHtml('/NUL-Guide/');
  assert.ok(html.includes('const base = "/NUL-Guide/"'));
  assert.ok(html.includes("location.replace(base + '#/' + route + location.search)"));
  assert.ok(!html.includes('localhost'));
});
test('root builds keep their existing routing while Pages builds emit a fallback and nojekyll marker', () => {
  const outputs = [];
  const plugin = pagesFallbackPlugin();
  plugin.configResolved({ base: '/' });
  plugin.generateBundle.call({ emitFile: file => outputs.push(file) });
  assert.equal(outputs.length, 0);
  plugin.configResolved({ base: '/NUL-Guide/' });
  plugin.generateBundle.call({ emitFile: file => outputs.push(file) });
  assert.deepEqual(outputs.map(file => file.fileName), ['404.html', '.nojekyll']);
});
