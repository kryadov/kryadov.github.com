import test from 'node:test';
import assert from 'node:assert/strict';
import { layout, pagePath, outputPath, PAGES } from '../src/render/layout.mjs';
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
  assert.match(head, /src="\/assets\/avatar\.jpg"/, 'no avatar');
  // Explicit dimensions reserve the box, so the header does not jump when the
  // image lands. Empty alt: the name follows in text, right there.
  assert.match(head, /width="320"/);
  assert.match(head, /height="320"/);
  assert.match(head, /alt=""/);
});

