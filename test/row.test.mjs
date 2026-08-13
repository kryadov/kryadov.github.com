import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueRow, rowLanguage } from '../src/render/row.mjs';

const base = {
  id: 'website2docs',
  repo: 'website2docs',
  private: false,
  hero: false,
  track: 'ai',
  year: 2026,
  stack: ['Python', 'BeautifulSoup'],
  live: null,
  cover: null,
  title: { en: 'Website to Docs', ru: 'Сайт в документ' },
  summary: { en: 'Crawl and export.', ru: 'Обходит и выгружает.' },
  detail: null,
};

const row = (w, l) => String(catalogueRow(w, l));

test('the first stack entry becomes the filterable language', () => {
  assert.equal(rowLanguage(base), 'Python');
  assert.equal(rowLanguage({ ...base, stack: [] }), 'other');
});

test('carries filter attributes', () => {
  const out = row(base, 'en');
  assert.match(out, /data-track="ai"/);
  assert.match(out, /data-lang="Python"/);
});

test('renders the localised title and summary', () => {
  assert.match(row(base, 'ru'), /Сайт в документ/);
  assert.match(row(base, 'ru'), /Обходит и выгружает\./);
});

test('a public row links to its repository', () => {
  assert.match(row(base, 'en'), /href="https:\/\/github\.com\/kryadov\/website2docs"/);
});

test('a private row contains no github url', () => {
  const secret = {
    ...base,
    id: 'replax',
    repo: null,
    private: true,
    detail: { en: 'An android app.', ru: 'Приложение для Android.' },
  };
  const out = row(secret, 'en');
  assert.ok(!out.includes('github.com'));
  assert.match(out, /<details/);
  assert.match(out, /An android app\./);
});

test('a row with a live url links to it', () => {
  const out = row({ ...base, live: 'https://example.org/' }, 'en');
  assert.match(out, /href="https:\/\/example\.org\/"/);
});

test('markup in the data is escaped', () => {
  const out = row({ ...base, title: { en: '<b>x</b>', ru: 'ы' } }, 'en');
  assert.ok(!out.includes('<b>x</b>'));
});

test('the action links survive composition as real anchors', () => {
  const out = row({ ...base, live: 'https://example.org/' }, 'en');
  assert.ok(!out.includes('&lt;a '), 'a nested template was escaped into visible text');
  assert.equal(out.match(/<a /g).length, 2);
});
