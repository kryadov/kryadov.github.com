import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBlog } from '../src/render/blog.mjs';

const posts = [
  {
    slug: 'newer', date: '2026-08-16',
    en: { title: 'Newer', summary: 'The newer one.', body: 'x', source: 'a' },
    ru: { title: 'Новее', summary: 'Которая новее.', body: 'x', source: 'b' },
  },
  {
    slug: 'older', date: '2025-01-02',
    en: { title: 'Older', summary: 'The older one.', body: 'x', source: 'c' },
    ru: { title: 'Старее', summary: 'Которая старее.', body: 'x', source: 'd' },
  },
];

test('renders a complete page in the right locale', () => {
  const page = renderBlog(posts, 'ru');
  assert.match(page, /^<!doctype html>/);
  assert.match(page, /<html lang="ru">/);
  assert.match(page, /<title>Блог — Константин Рядов<\/title>/);
});

test('keeps the order it was handed, newest first', () => {
  const page = renderBlog(posts, 'en');
  assert.ok(page.indexOf('Newer') < page.indexOf('Older'), 'the newer post must come first');
});

test('each item links to the post at its dated address', () => {
  assert.match(renderBlog(posts, 'en'), /href="\/blog\/2026\/08\/newer\/"/);
  assert.match(renderBlog(posts, 'ru'), /href="\/ru\/blog\/2025\/01\/older\/"/);
});

test('each item carries a machine date and a human one', () => {
  const page = renderBlog(posts, 'ru');
  assert.match(page, /<time class="blog__date" datetime="2026-08-16">16 августа 2026<\/time>/);
});

test('each item carries the summary of its own locale', () => {
  const page = renderBlog(posts, 'ru');
  assert.match(page, /Которая новее\./);
  assert.ok(!page.includes('The newer one.'), 'the english summary leaked into the russian page');
});

test('the list is an ordered list', () => {
  assert.match(renderBlog(posts, 'en'), /<ol class="blog__list">/);
});

test('an empty blog is a page that says so, not a blank page', () => {
  const page = renderBlog([], 'en');
  assert.match(page, /Nothing published yet\./);
  assert.ok(!page.includes('<ol class="blog__list">'), 'no empty list markup');
  assert.match(page, /<\/html>\s*$/);
});

test('escapes a title that contains markup', () => {
  const page = renderBlog(
    [{
      slug: 's', date: '2026-01-01',
      en: { title: 'a <b> & "c"', summary: 'x', body: 'y', source: 'z' },
      ru: { title: 'ru', summary: 'x', body: 'y', source: 'z' },
    }],
    'en',
  );
  assert.match(page, /a &lt;b&gt; &amp; &quot;c&quot;/);
});
