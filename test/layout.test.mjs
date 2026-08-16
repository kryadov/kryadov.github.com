import test from 'node:test';
import assert from 'node:assert/strict';
import { layout, pagePath, outputPath, feedPath, feedOutputPath, PAGES, SITE_URL } from '../src/render/layout.mjs';
import { LOCALES } from '../src/data.mjs';

test('english lives at the root, russian under /ru/', () => {
  assert.equal(pagePath('en', 'home'), '/');
  assert.equal(pagePath('ru', 'home'), '/ru/');
  assert.equal(pagePath('en', 'lab'), '/lab/');
  assert.equal(pagePath('ru', 'podcast'), '/ru/podcast/');
});

test('output paths are directory indexes', () => {
  assert.equal(outputPath('en', 'home'), 'index.html');
  assert.equal(outputPath('ru', 'home'), 'ru/index.html');
  assert.equal(outputPath('en', 'lab'), 'lab/index.html');
  assert.equal(outputPath('ru', 'podcast'), 'ru/podcast/index.html');
});

test('every locale and page combination has a path', () => {
  for (const locale of LOCALES) {
    for (const page of PAGES) {
      assert.match(outputPath(locale, page), /index\.html$/);
    }
  }
});

const page = layout({
  locale: 'en',
  page: 'home',
  title: 'Works',
  description: 'A showcase.',
  body: '<main id="content">hi</main>',
});

test('renders a complete document with the right language', () => {
  assert.match(page, /^<!doctype html>/);
  assert.match(page, /<html lang="en">/);
  assert.match(page, /<\/html>\s*$/);
});

test('declares the russian alternate', () => {
  assert.match(page, /<link rel="alternate" hreflang="ru" href="\/ru\/" \/>/);
});

test('the language toggle points at the counterpart page', () => {
  const ru = layout({ locale: 'ru', page: 'lab', title: 'x', description: 'y', body: '' });
  assert.match(ru, /href="\/lab\/"[^>]*>EN</);
});

test('escapes the title', () => {
  const escaped = layout({
    locale: 'en',
    page: 'home',
    title: 'a <b> & "c"',
    description: 'd',
    body: '',
  });
  assert.match(escaped, /<title>a &lt;b&gt; &amp; &quot;c&quot;<\/title>/);
  assert.ok(!escaped.includes('<title>a <b>'));
});

test('the header carries the github and telegram links', () => {
  const head = page.slice(page.indexOf('<header'), page.indexOf('</header>'));
  assert.match(head, /href="https:\/\/github\.com\/kryadov"/);
  assert.match(head, /href="https:\/\/t\.me\/youshouldknowit"/);
});

test('the header does not link the lab, which has its own card', () => {
  const head = page.slice(page.indexOf('<header'), page.indexOf('</header>'));
  assert.ok(!head.includes('href="/lab/"'), 'the lab is reached from its card, not the nav');
  assert.match(head, /href="\/podcast\/"/);
});

test('linkedin is reachable from both the header and the footer', () => {
  const url = 'https://www.linkedin.com/in/konstantin-ryadov/';
  const head = page.slice(page.indexOf('<header'), page.indexOf('</header>'));
  const foot = page.slice(page.indexOf('<footer'), page.indexOf('</footer>'));
  assert.ok(head.includes(`href="${url}"`), 'missing from the header');
  assert.ok(foot.includes(`href="${url}"`), 'missing from the footer');
});

test('the header carries the avatar, sized and decorative', () => {
  const head = page.slice(page.indexOf('<header'), page.indexOf('</header>'));
  assert.match(head, /src="\/assets\/avatar\.jpg\?v=[0-9a-f]{8}"/, 'no versioned avatar');
  // The attributes carry the drawn size, not the file's, so a stale or missing
  // stylesheet cannot render a 320px portrait in the header.
  assert.match(head, /width="40"/);
  assert.match(head, /height="40"/);
  assert.match(head, /alt=""/);
});

test('assets are versioned by content, so a deploy cannot be met with stale css', () => {
  // Without this, a returning visitor keeps the stylesheet they already have and
  // sees the new markup laid out by the old rules — which looks like a bug.
  const css = /<link rel="stylesheet" href="\/assets\/site\.css\?v=([0-9a-f]{8})"/.exec(page);
  assert.ok(css, 'the stylesheet is not versioned');

  const other = layout({ locale: 'ru', page: 'home', title: 'x', description: 'y', body: '' });
  const again = /site\.css\?v=([0-9a-f]{8})/.exec(other);
  assert.equal(again[1], css[1], 'the version must depend on the file, not the page');
});

test('the site url is absolute and has no trailing slash', () => {
  assert.equal(SITE_URL, 'https://kryadov.github.io');
});

const post = { slug: 'polyglot', date: '2026-08-16' };

test('a post lives under its year and month', () => {
  assert.equal(pagePath('en', 'blog', post), '/blog/2026/08/polyglot/');
  assert.equal(pagePath('ru', 'blog', post), '/ru/blog/2026/08/polyglot/');
});

test('without a post, the blog is its list page', () => {
  assert.equal(pagePath('en', 'blog'), '/blog/');
  assert.equal(pagePath('ru', 'blog'), '/ru/blog/');
});

test('post output paths are directory indexes too', () => {
  assert.equal(outputPath('en', 'blog', post), 'blog/2026/08/polyglot/index.html');
  assert.equal(outputPath('ru', 'blog', post), 'ru/blog/2026/08/polyglot/index.html');
});

test('each locale has its own feed', () => {
  assert.equal(feedPath('en'), '/blog/feed.xml');
  assert.equal(feedPath('ru'), '/ru/blog/feed.xml');
  assert.equal(feedOutputPath('en'), 'blog/feed.xml');
  assert.equal(feedOutputPath('ru'), 'ru/blog/feed.xml');
});

test('the header links the blog', () => {
  const head = page.slice(page.indexOf('<header'), page.indexOf('</header>'));
  assert.match(head, /href="\/blog\/"/);
});

test('every page advertises the feed of its own locale', () => {
  assert.match(page, /<link rel="alternate" type="application\/atom\+xml" href="\/blog\/feed\.xml"/);
  const ru = layout({ locale: 'ru', page: 'home', title: 'x', description: 'y', body: '' });
  assert.match(ru, /href="\/ru\/blog\/feed\.xml"/);
  assert.ok(!ru.includes('href="/blog/feed.xml"'), 'the russian page must not point at the english feed');
});

test('on a post page the alternates and the toggle point at the same post', () => {
  const rendered = layout({
    locale: 'en', page: 'blog', post, title: 'x', description: 'y', body: '',
  });
  assert.match(rendered, /<link rel="alternate" hreflang="ru" href="\/ru\/blog\/2026\/08\/polyglot\/" \/>/);
  assert.match(rendered, /href="\/ru\/blog\/2026\/08\/polyglot\/"[^>]*>RU</);
});

test('on a post page the blog nav item is the current one', () => {
  const rendered = layout({
    locale: 'en', page: 'blog', post, title: 'x', description: 'y', body: '',
  });
  const head = rendered.slice(rendered.indexOf('<header'), rendered.indexOf('</header>'));
  assert.match(head, /class="nav__link nav__link--current"[^>]*aria-current="page"/);
});

