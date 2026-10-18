import manifest from './design-assets.json';
import { assetPath } from '../utils/assetPath';

// Keep the original exported manifest intact; resolve its URLs for the current host.
export default Object.fromEntries(Object.entries(manifest).map(([page, files]) => [
  page, Object.fromEntries(Object.entries(files).map(([name, path]) => [name, assetPath(path)])),
]));
