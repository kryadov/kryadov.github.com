import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFileName, parsePost, truncate, loadPosts } from '../src/posts.mjs';

async function dirWith(files) {
  const dir = await mkdtemp(join(tmpdir(), 'posts-'));
  await mkdir(dir, { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    await writeFile(join(dir, name), contents, 'utf8');
  }
  return dir;
}

const body = (title = 'Title') => `# ${title}\n\nFirst paragraph.\n\nSecond.\n`;

// --- the file name is the contract -----------------------------------------

test('parses a well formed name into date, slug and locale', () => {
  assert.deepEqual(parseFileName('2026-08-16-polyglot.en.md'), {
    date: '2026-08-16',
    slug: 'polyglot',
    locale: 'en',
  });
});

test('accepts a multi-word slug', () => {
  assert.equal(parseFileName('2026-01-02-why-it-broke.ru.md').slug, 'why-it-broke');
});

test('rejects names that do not follow the contract', () => {
  for (const name of [
    'polyglot.en.md',
    '2026-8-16-polyglot.en.md',
    '2026-08-16-polyglot.md',
    '2026-08-16-polyglot.de.md',
    '2026-08-16-polyglot.en.markdown',
    'notes.txt',
  ]) {
    assert.equal(parseFileName(name), null, `${name} must not parse`);
  }
});

// --- front matter -----------------------------------------------------------

test('reads a summary out of front matter', () => {
  const post = parsePost(`---\nsummary: The short version.\n---\n\n${body()}`);
  assert.equal(post.summary, 'The short version.');
  assert.ok(!post.body.includes('summary:'));
});

test('skips blank lines and comments inside front matter', () => {
  const post = parsePost(`---\n\n# a note\nsummary: Kept.\n\n---\n\n${body()}`);
  assert.equal(post.summary, 'Kept.');
});

test('an unclosed front matter block is an error', () => {
  assert.throws(
    () => parsePost(`---\nsummary: x\n\n${body()}`),
    /front matter is not closed/,
  );
});

test('an unknown front matter key is an error, not a shrug', () => {
  assert.throws(() => parsePost(`---\nsumary: typo\n---\n\n${body()}`), /unknown front matter key: sumary/);
});

test('a front matter line without a colon is an error', () => {
  assert.throws(() => parsePost(`---\nsummary\n---\n\n${body()}`), /key: value/);
});

// --- title ------------------------------------------------------------------

test('takes the title from the first h1 and cuts it out of the body', () => {
  const post = parsePost(body('Why microservices'));
  assert.equal(post.title, 'Why microservices');
  assert.ok(!post.body.includes('# Why microservices'));
  assert.match(post.body, /First paragraph\./);
});

test('a post without an h1 is an error', () => {
  assert.throws(() => parsePost('Just prose, no heading.\n'), /no # h1/i);
});

test('a post that is nothing but its title is an error', () => {
  assert.throws(() => parsePost('# Alone\n'), /body is empty/);
});

// --- summary ----------------------------------------------------------------

test('falls back to the first paragraph, stripped of inline markup', () => {
  const post = parsePost('# T\n\nA **bold** [link](https://x.test) and `code`.\n\nMore.\n');
  assert.equal(post.summary, 'A bold link and code.');
});

test('the fallback skips a leading blockquote marker', () => {
  const post = parsePost('# T\n\n> Quoted opening.\n\nRest.\n');
  assert.equal(post.summary, 'Quoted opening.');
});

test('front matter wins over the first paragraph', () => {
  const post = parsePost(`---\nsummary: Chosen.\n---\n\n# T\n\nDerived.\n`);
  assert.equal(post.summary, 'Chosen.');
});

test('a link whose URL contains parentheses does not garble the summary', () => {
  const post = parsePost('# T\n\nSee [this](https://x.test/a(b)c) for more.\n\nEnd.\n');
  assert.equal(post.summary, 'See this for more.');
});

test('truncate leaves short text alone', () => {
  assert.equal(truncate('Short enough.'), 'Short enough.');
});

test('truncate cuts on a word boundary and marks the cut', () => {
  const cut = truncate(`${'word '.repeat(60)}end`);
  assert.ok(cut.length <= 201, `too long: ${cut.length}`);
  assert.ok(cut.endsWith('…'));
  assert.ok(!cut.includes('wor…'), 'must not cut mid-word');
});

test('truncate keeps text of exactly the limit intact', () => {
  const exact = 'a'.repeat(200);
  assert.equal(truncate(exact), exact);
});

// --- loading and validating a directory -------------------------------------

test('loads a pair into one post, newest first', async () => {
  const dir = await dirWith({
    '2026-08-16-second.en.md': body('Second EN'),
    '2026-08-16-second.ru.md': body('Второй RU'),
    '2025-01-01-first.en.md': body('First EN'),
    '2025-01-01-first.ru.md': body('Первый RU'),
  });
  const posts = await loadPosts(dir);
  assert.deepEqual(posts.map((p) => p.slug), ['second', 'first']);
  assert.equal(posts[0].date, '2026-08-16');
  assert.equal(posts[0].en.title, 'Second EN');
  assert.equal(posts[0].ru.title, 'Второй RU');
  assert.equal(posts[0].en.source, `${dir}/2026-08-16-second.en.md`);
});

test('posts sharing a date are ordered by slug, so the order is stable', async () => {
  const dir = await dirWith({
    '2026-08-16-beta.en.md': body(), '2026-08-16-beta.ru.md': body(),
    '2026-08-16-alpha.en.md': body(), '2026-08-16-alpha.ru.md': body(),
  });
  assert.deepEqual((await loadPosts(dir)).map((p) => p.slug), ['alpha', 'beta']);
});

test('an empty directory loads as an empty list, not an error', async () => {
  assert.deepEqual(await loadPosts(await dirWith({})), []);
});

test('a non-existent directory returns an empty list, not an error', async () => {
  const nonExistent = join(tmpdir(), 'posts-nonexistent-does-not-exist-12345');
  assert.deepEqual(await loadPosts(nonExistent), []);
});

test('a missing translation is an error naming the file that is absent', async () => {
  const dir = await dirWith({ '2026-08-16-lonely.en.md': body() });
  await assert.rejects(loadPosts(dir), /2026-08-16-lonely\.ru\.md/);
});

test('a file that does not follow the naming contract is an error', async () => {
  const dir = await dirWith({
    'draft.md': body(),
    '2026-08-16-ok.en.md': body(), '2026-08-16-ok.ru.md': body(),
  });
  await assert.rejects(loadPosts(dir), /draft\.md/);
});

test('a slug outside the allowed characters is an error naming the slug', async () => {
  const dir = await dirWith({
    '2026-08-16-Bad_Slug.en.md': body(), '2026-08-16-Bad_Slug.ru.md': body(),
    '2026-08-16-Upper.en.md': body(), '2026-08-16-Upper.ru.md': body(),
    '2026-08-16-with_underscore.en.md': body(), '2026-08-16-with_underscore.ru.md': body(),
    '2026-08-16--leading.en.md': body(), '2026-08-16--leading.ru.md': body(),
    '2026-08-16-trailing-.en.md': body(), '2026-08-16-trailing-.ru.md': body(),
  });
  const error = await loadPosts(dir).then(() => null, (e) => e);
  assert.ok(error, 'expected a rejection');
  assert.match(error.message, /slug Bad_Slug/);
  assert.match(error.message, /slug Upper/);
  assert.match(error.message, /slug with_underscore/);
  assert.match(error.message, /slug -leading/);
  assert.match(error.message, /slug trailing-/);
});

test('a date that is not on the calendar is an error', async () => {
  const dir = await dirWith({
    '2026-02-30-ghost.en.md': body(), '2026-02-30-ghost.ru.md': body(),
  });
  await assert.rejects(loadPosts(dir), /2026-02-30/);
});

test('one slug with two dates is an error', async () => {
  const dir = await dirWith({
    '2026-08-16-twin.en.md': body(), '2026-08-16-twin.ru.md': body(),
    '2026-08-17-twin.en.md': body(), '2026-08-17-twin.ru.md': body(),
  });
  await assert.rejects(loadPosts(dir), /twin/);
});

test('a broken body is an error naming its file', async () => {
  const dir = await dirWith({
    '2026-08-16-bad.en.md': 'No heading here.\n',
    '2026-08-16-bad.ru.md': body(),
  });
  await assert.rejects(loadPosts(dir), /2026-08-16-bad\.en\.md/);
});

test('every problem is reported at once, not one per run', async () => {
  const dir = await dirWith({
    'stray.txt': 'x',
    '2026-08-16-lonely.en.md': body(),
    '2026-13-01-impossible.en.md': body(),
    '2026-13-01-impossible.ru.md': body(),
  });
  const error = await loadPosts(dir).then(() => null, (e) => e);
  assert.ok(error, 'expected a rejection');
  assert.match(error.message, /stray\.txt/);
  assert.match(error.message, /lonely\.ru\.md/);
  assert.match(error.message, /2026-13-01/);
});

test('the real posts directory loads and pairs up', async () => {
  const posts = await loadPosts();
  assert.ok(posts.length >= 1);
  for (const post of posts) {
    assert.ok(post.en.title && post.ru.title, `${post.slug} is missing a title`);
    assert.ok(post.en.summary && post.ru.summary, `${post.slug} is missing a summary`);
  }
});
