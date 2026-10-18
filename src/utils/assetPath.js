/** Resolve public assets for both local root hosting and a GitHub Pages project path. */
export function assetPath(path, base = import.meta.env?.BASE_URL || '/') {
  return `${base.replace(/\/?$/, '/')}${path.replace(/^\/+/, '')}`;
}
