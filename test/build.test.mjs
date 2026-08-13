import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { build, PASSTHROUGH } from '../build.mjs';
import { loadPrivateRepos, secretNames, PRIVATE_REPOS_PATH } from '../scripts/private-repos.mjs';

const OUT = 'dist-test';

test('build writes every page in both locales, and the assets', async (t) => {
  t.after(() => rm(OUT, { recursive: true, force: true }));
  await rm(OUT, { recursive: true, force: true });
  const written = await build(OUT);

  assert.deepEqual(written.sort(), [
    'index.html',
    'lab/index.html',
    'music/index.html',
    'podcast/index.html',
    'ru/index.html',
    'ru/lab/index.html',
    'ru/music/index.html',
    'ru/podcast/index.html',
  ]);

  await stat(`${OUT}/assets/site.css`);
  await stat(`${OUT}/assets/filter.js`);
});

test('the preserved urls survive the build', async (t) => {
  t.after(() => rm(OUT, { recursive: true, force: true }));
  await build(OUT);
  for (const path of [
    'log4j-logback.png',
    'client/POLICY.md',
    'client/TERMS_AND_CONDS.md',
    'client/fractal/001/index-7.html',
    'client/svg-set/index.html',
    'ysnit/2025-01-01.html',
  ]) {
    await stat(`${OUT}/${path}`);
  }
});

test('no specification or plan is ever copied into the output', async (t) => {
  t.after(() => rm(OUT, { recursive: true, force: true }));
  await build(OUT);
  for (const forbidden of ['docs', 'specs', 'plans']) {
    assert.ok(!PASSTHROUGH.includes(forbidden), `${forbidden} is in PASSTHROUGH`);
    await assert.rejects(stat(`${OUT}/${forbidden}`), /ENOENT/);
  }
});

test('the english page is not the russian page', async (t) => {
  t.after(() => rm(OUT, { recursive: true, force: true }));
  await build(OUT);
  const en = await readFile(`${OUT}/index.html`, 'utf8');
  const ru = await readFile(`${OUT}/ru/index.html`, 'utf8');
  assert.match(en, /<html lang="en">/);
  assert.match(ru, /<html lang="ru">/);
  assert.notEqual(en, ru);
});

test('no private repository name reaches the output as a github link', async (t) => {
  t.after(() => rm(OUT, { recursive: true, force: true }));
  await build(OUT);
  const works = JSON.parse(await readFile('works.json', 'utf8'));
  const en = await readFile(`${OUT}/index.html`, 'utf8');
  const ru = await readFile(`${OUT}/ru/index.html`, 'utf8');
  for (const work of works.filter((w) => w.private)) {
    for (const page of [en, ru]) {
      assert.ok(
        !page.includes(`github.com/kryadov/${work.id}`),
        `${work.id} leaked a github link`,
      );
    }
  }
});

test('no real private repository name appears in any tracked file', async (t) => {
  // The mapping lives in the private site-docs repository, checked out beside
  // this one. CI clones only the public repository, so it is absent there and
  // there is nothing to check — and nothing that could leak.
  const mapping = await loadPrivateRepos();
  if (mapping === null) {
    t.skip(`no mapping at ${PRIVATE_REPOS_PATH}`);
    return;
  }

  const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const names = secretNames(mapping);
  assert.ok(names.length > 0, 'the mapping is empty');

  for (const file of tracked) {
    const contents = await readFile(file, 'utf8').catch(() => '');
    for (const name of names) {
      assert.ok(!contents.includes(name), `${file} names the private repository ${name}`);
    }
  }
});
