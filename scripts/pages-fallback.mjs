export function pagesFallbackHtml(base) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opening NUL Guide</title>
  <script>
    // Preserve clean links shared before the move to static GitHub Pages hosting.
    const base = ${JSON.stringify(base)};
    const route = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : '';
    location.replace(base + '#/' + route + location.search);
  </script>
</head>
<body><p>Opening NUL Guide… <a href="${base}">Return to NUL Guide</a></p></body>
</html>`;
}

export function pagesFallbackPlugin() {
  let base = '/';
  return {
    name: 'nul-guide-pages-fallback',
    apply: 'build',
    configResolved(config) { base = config.base; },
    generateBundle() {
      if (base === '/') return;
      this.emitFile({ type: 'asset', fileName: '404.html', source: pagesFallbackHtml(base) });
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
    },
  };
}
