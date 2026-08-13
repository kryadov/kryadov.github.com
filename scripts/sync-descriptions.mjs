import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadPrivateRepos, PRIVATE_REPOS_PATH } from './private-repos.mjs';

const run = promisify(execFile);
const apply = process.argv.includes('--apply');
const MAX = 350;

const works = JSON.parse(await readFile('works.json', 'utf8'));

// Private entries carry no repo field, and their id is an opaque private-NN slot
// rather than a repository name — works.json is tracked in a public repository.
// The real names live only in the private site-docs repository.
const mapping = await loadPrivateRepos();
if (mapping === null) {
  console.error(`no mapping at ${PRIVATE_REPOS_PATH} — check out kryadov/site-docs beside this repository, or set PRIVATE_REPOS.`);
  process.exit(1);
}
const privateRepos = mapping.map;

const targets = works
  .map((work) => ({
    repo: work.repo ?? (work.private ? (privateRepos[work.id] ?? null) : null),
    text: work.summary.en.trim(),
  }))
  .filter((entry) => entry.repo !== null)
  .map((entry) => ({
    ...entry,
    text: entry.text.length > MAX ? `${entry.text.slice(0, MAX - 1).trimEnd()}…` : entry.text,
  }));

const unmapped = works.filter((w) => w.private && !privateRepos[w.id]);
if (unmapped.length > 0) {
  console.error(`${mapping.path} has no entry for: ${unmapped.map((w) => w.id).join(', ')}`);
  process.exit(1);
}

console.log(`${targets.length} repositories to update${apply ? '' : ' (dry run)'}\n`);

for (const { repo, text } of targets) {
  console.log(`${repo}\n  ${text}\n`);
  if (!apply) continue;
  try {
    await run('gh', ['repo', 'edit', `kryadov/${repo}`, '--description', text]);
  } catch (error) {
    console.error(`  FAILED: ${error.stderr || error.message}`);
  }
}

if (!apply) console.log('Re-run with --apply to write these.');
