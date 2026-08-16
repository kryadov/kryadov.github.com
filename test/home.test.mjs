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

test('the home page opens with the intro, above the heroes', async () => {
  const { loadWorks } = await import('../src/data.mjs');
  const works = await loadWorks();
  for (const [locale, phrase] of [['en', 'Kostya Ryadov'], ['ru', 'Костя Рядов']]) {
    const page = renderHome(works, locale);
    const intro = page.indexOf('class="intro"');
    assert.ok(intro !== -1, `${locale}: no intro`);
    assert.ok(page.slice(intro, intro + 400).includes(phrase), `${locale}: intro does not introduce`);
    assert.ok(intro < page.indexOf('heroes__grid'), `${locale}: intro is below the heroes`);
  }
});

const latest = [
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

test('the latest posts sit between the greeting and the selected work', () => {
  const page = renderHome(works, 'en', latest);
  assert.ok(page.indexOf('class="intro"') < page.indexOf('id="latest"'));
  assert.ok(page.indexOf('id="latest"') < page.indexOf('id="heroes"'));
});

test('each latest entry links to its post', () => {
  const page = renderHome(works, 'en', latest);
  assert.match(page, /href="\/blog\/2026\/08\/newer\/"/);
  assert.match(page, /The newer one\./);
});

test('the block leads on to the whole blog', () => {
  assert.match(renderHome(works, 'en', latest), /<a href="\/blog\/">Read the blog<\/a>/);
  assert.match(renderHome(works, 'ru', latest), /<a href="\/ru\/blog\/">Читать блог<\/a>/);
});

test('with no posts there is no empty heading on the home page', () => {
  const page = renderHome(works, 'en', []);
  assert.ok(!page.includes('id="latest"'));
  assert.ok(!page.includes('Latest posts'));
});

test('the third argument is optional, so the home page still renders alone', () => {
  const page = renderHome(works, 'en');
  assert.match(page, /^<!doctype html>/);
  assert.ok(!page.includes('id="latest"'));
});

