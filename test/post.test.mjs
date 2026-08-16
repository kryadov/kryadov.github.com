import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPost } from '../src/render/post.mjs';

const post = {
  slug: 'polyglot', date: '2026-08-16',
  en: {
    title: 'Why microservices',
    summary: 'The short version.',
    body: '## A heading\n\nA paragraph with **bold**.\n\n- one\n- two\n',
    source: 'posts/2026-08-16-polyglot.en.md',
  },
  ru: {
    title: 'Почему микросервисы',
    summary: 'Короткая версия.',
    body: '## Заголовок\n\nАбзац.\n',
    source: 'posts/2026-08-16-polyglot.ru.md',
  },
};

test('the title is the h1, exactly once', () => {
  const page = renderPost(post, 'en');
  assert.equal(page.match(/<h1/g).length, 1);
  assert.match(page, /<h1 class="post__title">Why microservices<\/h1>/);
});

test('the document title carries the post title and the name', () => {
  assert.match(renderPost(post, 'en'), /<title>Why microservices — Konstantin Ryadov<\/title>/);
  assert.match(renderPost(post, 'ru'), /<title>Почему микросервисы — Константин Рядов<\/title>/);
});

test('the description is the summary', () => {
  assert.match(renderPost(post, 'en'), /<meta name="description" content="The short version\." \/>/);
});

test('the date is printed and machine readable', () => {
  assert.match(renderPost(post, 'en'), /<time datetime="2026-08-16">16 August 2026<\/time>/);
});

test('the body arrives as html, not as escaped markdown', () => {
  const page = renderPost(post, 'en');
  assert.match(page, /<h2[^>]*>A heading<\/h2>/);
  assert.match(page, /<strong>bold<\/strong>/);
  assert.match(page, /<li>one<\/li>/);
  assert.ok(!page.includes('**bold**'), 'the markdown was escaped instead of rendered');
});

test('the way back to the list is on the page', () => {
  assert.match(renderPost(post, 'en'), /<a href="\/blog\/">All posts<\/a>/);
  assert.match(renderPost(post, 'ru'), /<a href="\/ru\/blog\/">Все записи<\/a>/);
});

test('the alternates and the toggle point at the same post in the other locale', () => {
  const page = renderPost(post, 'en');
  assert.match(page, /<link rel="alternate" hreflang="ru" href="\/ru\/blog\/2026\/08\/polyglot\/" \/>/);
  assert.match(page, /href="\/ru\/blog\/2026\/08\/polyglot\/"[^>]*>RU</);
});

test('the blog is the current section while reading a post', () => {
  const page = renderPost(post, 'en');
  const head = page.slice(page.indexOf('<header'), page.indexOf('</header>'));
  assert.match(head, /nav__link--current[^>]*href="\/blog\/"|href="\/blog\/"[^>]*aria-current/);
});

test('escapes a title that contains markup, in the heading and in the title tag', () => {
  const nasty = { ...post, en: { ...post.en, title: 'a <b> & "c"' } };
  const page = renderPost(nasty, 'en');
  assert.match(page, /<title>a &lt;b&gt; &amp; &quot;c&quot; — Konstantin Ryadov<\/title>/);
  assert.match(page, /<h1 class="post__title">a &lt;b&gt; &amp; &quot;c&quot;<\/h1>/);
});
