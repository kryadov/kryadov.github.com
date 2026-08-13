import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// GitHub Pages serves assets with `Cache-Control: max-age=600` and browsers keep
// them for longer than that on their own heuristics. Without a version in the
// URL a visitor who has seen the site before keeps the stylesheet they already
// have, so a deploy lands the new HTML against the old CSS — which looks exactly
// like the layout being broken, and is indistinguishable from it.
//
// The version is a hash of the file's own contents, so it changes when and only
// when the file does. Read once at module load: this runs at build time.
const versions = new Map();

export function assetUrl(path) {
  if (!versions.has(path)) {
    let version = 'dev';
    try {
      const bytes = readFileSync(`.${path}`);
      version = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
    } catch {
      // A missing asset is the build's problem to report, not this helper's.
      // Falling back keeps the renderers usable in isolation, as the tests use them.
    }
    versions.set(path, version);
  }
  return `${path}?v=${versions.get(path)}`;
}
