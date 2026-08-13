import test from 'node:test';
import assert from 'node:assert/strict';
import { heroCard } from '../src/render/card.mjs';

const base = {
  id: 'race-the-city',
  repo: 'race-the-city',
  private: false,
  hero: true,
  track: 'interactive',
  year: 2026,
  stack: ['TypeScript', 'Three.js'],
  live: 'https://race-the-city.games',
  cover: null,
  title: { en: 'Race the City', ru: 'Гонки по городу' },
  summary: { en: 'Drive a real city.', ru: 'Едешь по настоящему городу.' },
  detail: null,
};

const secret = {
  ...base,
  id: 'cve-manager',
  repo: null,
  private: true,
  live: null,
  title: { en: 'JVM Vulnerability Service', ru: 'Сервис уязвимостей JVM' },
  summary: { en: 'Watches running JVMs.', ru: 'Следит за живыми JVM.' },
  detail: { en: 'A java agent reports.', ru: 'Java-агент сообщает.' },
};

const card = (w, l) => String(heroCard(w, l));

test('renders the localised title and summary', () => {
  const en = card(base, 'en');
  assert.match(en, /Race the City/);
  assert.match(en, /Drive a real city\./);
  const ru = card(base, 'ru');
  assert.match(ru, /Гонки по городу/);
  assert.ok(!ru.includes('Drive a real city.'));
});

test('a public card links to its repository and shows the repo name', () => {
  const out = card(base, 'en');
  assert.match(out, /href="https:\/\/github\.com\/kryadov\/race-the-city"/);
  assert.match(out, /race-the-city/);
});

test('a live card carries the badge and a demo link', () => {
  const out = card(base, 'en');
  assert.match(out, /card__badge/);
  assert.match(out, /href="https:\/\/race-the-city\.games"/);
});

test('a private card contains no github url at all', () => {
  const out = card(secret, 'en');
  assert.ok(!out.includes('github.com'), 'private card leaked a github link');
  assert.match(out, /Closed source/);
});

test('a private card exposes its detail through a details element', () => {
  const out = card(secret, 'en');
  assert.match(out, /<details/);
  assert.match(out, /A java agent reports\./);
});

test('a public card has no details element', () => {
  assert.ok(!card(base, 'en').includes('<details'));
});

test('the cover is inlined as svg when cover is null', () => {
  assert.match(card(base, 'en'), /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});

test('an explicit cover becomes an img and suppresses the generated svg', () => {
  const out = card({ ...base, cover: '/assets/shots/race.png' }, 'en');
  assert.match(out, /<img class="card__cover" src="\/assets\/shots\/race\.png"/);
  assert.ok(!out.includes('<svg'));
});

test('stack entries and the year are rendered', () => {
  const out = card(base, 'en');
  assert.match(out, /TypeScript/);
  assert.match(out, /Three\.js/);
  assert.match(out, /2026/);
});

test('markup in the data is escaped', () => {
  const out = card({ ...base, summary: { en: '<script>x</script>', ru: 'ы' } }, 'en');
  assert.ok(!out.includes('<script>'));
  assert.match(out, /&lt;script&gt;/);
});

test('the demo and source links survive composition as real anchors', () => {
  const out = card(base, 'en');
  assert.ok(!out.includes('&lt;a '), 'a nested template was escaped into visible text');
  assert.equal(out.match(/<a /g).length, 2);
});
