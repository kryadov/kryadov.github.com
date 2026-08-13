import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderMusic, ARTIST } from '../src/render/music.mjs';

const releases = JSON.parse(await readFile('music.json', 'utf8'));

test('every release has an id, a title and a band.link url', () => {
  for (const release of releases) {
    assert.ok(release.id.trim().length > 0, 'missing id');
    assert.ok(release.title.trim().length > 0, `${release.id}: missing title`);
    assert.match(release.url, /^https:\/\/band\.link\/[A-Za-z0-9_]+$/, `${release.id}: bad url`);
  }
});

test('no release is listed twice', () => {
  const urls = releases.map((r) => r.url);
  assert.equal(new Set(urls).size, urls.length, 'a release url is duplicated');
  const ids = releases.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'a release id is duplicated');
});

test('no title kept the BandLink suffix or the artist prefix', () => {
  for (const release of releases) {
    assert.ok(!release.title.includes('BandLink'), `${release.id}: suffix survived`);
    assert.ok(!release.title.includes(ARTIST), `${release.id}: artist prefix survived`);
  }
});

test('every release is linked from the page, in both locales', () => {
  for (const locale of ['en', 'ru']) {
    const page = renderMusic(releases, locale);
    for (const release of releases) {
      assert.ok(page.includes(`href="${release.url}"`), `${release.url} not linked in ${locale}`);
    }
  }
});

test('renders a complete document in the requested locale', () => {
  const ru = renderMusic(releases, 'ru');
  assert.match(ru, /^<!doctype html>/);
  assert.match(ru, /<html lang="ru">/);
  assert.match(ru, /Музыка/);
  assert.match(renderMusic(releases, 'en'), /Music/);
});

test('the artist name is shown but not translated', () => {
  for (const locale of ['en', 'ru']) {
    assert.match(renderMusic(releases, locale), /PERSONAL ANIMOSITY/);
  }
});

test('markup in a title would be escaped', () => {
  const page = renderMusic([{ id: 'x', title: '<b>x</b>', url: 'https://band.link/x' }], 'en');
  assert.ok(!page.includes('<b>x</b>'));
  assert.match(page, /&lt;b&gt;/);
});
