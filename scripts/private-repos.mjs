import { readFile } from 'node:fs/promises';

// Where the opaque `private-NN` -> real repository mapping lives.
//
// Not in this repository. This one is public, and the mapping is the single
// file that would undo the whole reason the ids are opaque: works.json is
// tracked, so every id in it is published whether or not a page links to it.
// The mapping belongs with the specs and plans, in the private site-docs
// repository, which is checked out beside this one.
//
// Override with PRIVATE_REPOS if your checkout is laid out differently.
export const PRIVATE_REPOS_PATH =
  process.env.PRIVATE_REPOS ?? '../site-docs/private-repos.json';

/**
 * Reads the mapping, or returns null when it is not there.
 *
 * Absent is a normal state, not an error: CI checks out only the public
 * repository, so anything that needs the mapping has to be able to stand down
 * rather than fail the build.
 */
export async function loadPrivateRepos(path = PRIVATE_REPOS_PATH) {
  let contents;
  try {
    contents = await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }

  const parsed = JSON.parse(contents);
  if (parsed.map === undefined || parsed.map === null) {
    throw new Error(`${path} has no "map" object`);
  }
  return {
    map: parsed.map,
    alreadyPublic: parsed.alreadyPublic ?? [],
    path,
  };
}

/** The repository names that must never appear in a tracked file. */
export function secretNames(mapping) {
  const disclosed = new Set(mapping.alreadyPublic);
  return Object.values(mapping.map).filter((name) => !disclosed.has(name));
}
