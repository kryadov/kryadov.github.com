import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHome, catalogueLanguages } from '../src/render/home.mjs';

const works = [
  {
    id: 'hero-a', repo: 'hero-a', private: false, hero: true, track: 'ai', year: 2026,
    stack: ['Python'], live: null, cover: null,
    title: { en: 'Hero A', ru: 'Герой А' },
    summary: { en: 'First.', ru: 'Первый.' }, detail: null,
  },
  {
    id: 'tail-a', repo: 'tail-a', private: false, hero: false, track: 'jvm', year: 2025,
    stack: ['Java'], live: null, cover: null,
    title: { en: 'Tail A', ru: 'Хвост А' },
    summary: { en: 'Second.', ru: 'Второй.' }, detail: null,
  },
  {
    id: 'tail-b', repo: null, private: true, hero: false, track: 'jvm', year: 2024,
    stack: ['Java'], live: null, cover: null,
    title: { en: 'Tail B', ru: 'Хвост Б' },
    summary: { en: 'Third.', ru: 'Третий.' },
    detail: { en: 'Detail.', ru: 'Подробности.' },
  },
];

test('collects the distinct catalogue languages in order', () => {
  assert.deepEqual(catalogueLanguages(works), ['Java']);
});

test('heroes appear in the hero section and not in the catalogue', () => {
  const page = renderHome(works, 'en');
  const heroes = page.slice(page.indexOf('id="heroes"'), page.indexOf('id="catalogue"'));
  assert.match(heroes, /Hero A/);
  assert.ok(!heroes.includes('Tail A'));
});

test('the catalogue holds every non-hero and no hero', () => {
  const page = renderHome(works, 'en');
  const catalogue = page.slice(page.indexOf('id="catalogue"'));
  assert.match(catalogue, /Tail A/);
  assert.match(catalogue, /Tail B/);
  assert.ok(!catalogue.includes('Hero A'));
});

test('empty tracks produce no heading', () => {
  const page = renderHome(works, 'en');
  assert.ok(!page.includes('Medicine & osteopathy'));
});

test('the filter bar starts hidden so it cannot dead-end a no-js visitor', () => {
  assert.match(renderHome(works, 'en'), /<form class="filter"[^>]*hidden/);
});

test('renders a whole document in the requested locale', () => {
  const ru = renderHome(works, 'ru');
  assert.match(ru, /^<!doctype html>/);
  assert.match(ru, /<html lang="ru">/);
  assert.match(ru, /Герой А/);
});

test('the private entry leaks no github url anywhere on the page', () => {
  const page = renderHome(works, 'en');
  assert.ok(!page.includes('github.com/kryadov/tail-b'));
});

test('the lab is one hero card, not three catalogue rows', async () => {
  const { loadWorks } = await import('../src/data.mjs');
  const works = await loadWorks();
  const lab = works.filter((w) => w.live === '/lab/');
  assert.equal(lab.length, 1, 'the lab should be a single entry');
  assert.equal(lab[0].id, 'lab');
  assert.ok(lab[0].hero, 'the lab entry should be a hero');

  const page = renderHome(works, 'en');
  const heroes = page.slice(page.indexOf('heroes__grid'), page.indexOf('id="catalogue"'));
  assert.match(heroes, /href="\/lab\/"/, 'the lab card should link to the lab page');
});

