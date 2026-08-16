import test from 'node:test';
import assert from 'node:assert/strict';
import { renderFeed } from '../src/render/feed.mjs';

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

test('starts with an xml declaration and an atom feed', () => {
  const feed = renderFeed(posts, 'en');
  assert.match(feed, /^<\?xml version="1\.0" encoding="utf-8"\?>/);
  assert.match(feed, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom" xml:lang="en">/);
});

test('is well formed enough to parse as xml', () => {
  // No XML parser in the standard library, so this is a structural check: every
  // opened element is closed, and the tags balance.
  const feed = renderFeed(posts, 'ru');
  const opened = feed.match(/<(?!\?|\/)([a-z:]+)[^>]*?(?<!\/)>/g) ?? [];
  const closed = feed.match(/<\/([a-z:]+)>/g) ?? [];
  assert.equal(opened.length, closed.length, 'unbalanced tags');
  assert.ok(!feed.includes('&nbsp;'), 'named html entities are not valid in xml');
});

test('every url is absolute', () => {
  const feed = renderFeed(posts, 'en');
  for (const href of feed.match(/href="[^"]*"/g)) {
    assert.match(href, /href="https:\/\/kryadov\.github\.io\//, `${href} is not absolute`);
  }
  assert.match(feed, /<id>https:\/\/kryadov\.github\.io\/blog\/2026\/08\/newer\/<\/id>/);
});

test('points at itself and at its list page', () => {
  const feed = renderFeed(posts, 'ru');
  assert.match(feed, /rel="self" href="https:\/\/kryadov\.github\.io\/ru\/blog\/feed\.xml"/);
  assert.match(feed, /rel="alternate" href="https:\/\/kryadov\.github\.io\/ru\/blog\/"/);
});

test('carries one entry per post, in order', () => {
  const feed = renderFeed(posts, 'en');
  assert.equal(feed.match(/<entry>/g).length, 2);
  assert.ok(feed.indexOf('Newer') < feed.indexOf('Older'));
});

test('an entry carries the summary, not the body', () => {
  const feed = renderFeed(posts, 'en');
  assert.match(feed, /<summary>The newer one\.<\/summary>/);
});

test('a locale feed holds no other locale', () => {
  const ru = renderFeed(posts, 'ru');
  assert.match(ru, /<title>Новее<\/title>/);
  assert.ok(!ru.includes('Newer'), 'the english title leaked into the russian feed');
  assert.ok(!ru.includes('"https://kryadov.github.io/blog/'), 'a russian entry points at an english url');
});

test('dates are rfc 3339 timestamps', () => {
  const feed = renderFeed(posts, 'en');
  assert.match(feed, /<updated>2026-08-16T00:00:00Z<\/updated>/);
});

test('the feed is dated by its newest post', () => {
  const feed = renderFeed(posts, 'en');
  const first = feed.indexOf('<updated>');
  assert.equal(feed.slice(first, first + 40).includes('2026-08-16'), true);
});

test('an empty feed is still a valid feed', () => {
  const feed = renderFeed([], 'en');
  assert.match(feed, /<\/feed>\s*$/);
  assert.ok(!feed.includes('<entry>'));
  assert.match(feed, /<updated>\d{4}-\d{2}-\d{2}T00:00:00Z<\/updated>/);
});

test('escapes the markup characters a title may contain', () => {
  const feed = renderFeed(
    [{
      slug: 's', date: '2026-01-01',
      en: { title: 'a <b> & "c"', summary: 'x & y', body: 'z', source: 'q' },
      ru: { title: 'ru', summary: 'x', body: 'z', source: 'q' },
    }],
    'en',
  );
  assert.match(feed, /<title>a &lt;b&gt; &amp; &quot;c&quot;<\/title>/);
  assert.match(feed, /<summary>x &amp; y<\/summary>/);
});
