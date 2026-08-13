import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderPodcast } from '../src/render/podcast.mjs';

const sections = JSON.parse(await readFile('podcast.json', 'utf8'));

test('every section is bilingual and non-empty', () => {
  for (const section of sections) {
    assert.ok(section.name.en, 'missing english section name');
    assert.ok(section.name.ru, 'missing russian section name');
    assert.ok(section.episodes.length > 0, `${section.name.en} has no episodes`);
  }
});

test('every episode has an iso date, a title, a url and a length', () => {
  for (const section of sections) {
    for (const episode of section.episodes) {
      assert.match(episode.date, /^\d{4}-\d{2}-\d{2}$/, `${episode.title}: bad date`);
      assert.ok(episode.title.trim().length > 0);
      assert.match(episode.url, /^https:\/\/ysnit\.mave\.digital\/ep-\d+$/);
      assert.match(episode.length, /^\d{2}:\d{2}$/);
    }
  }
});

test('the transcription errors from the source markdown are fixed', () => {
  const all = JSON.stringify(sections);
  assert.ok(!all.includes('июдя'), 'the июдя typo survived');
  assert.ok(!all.includes('41:43 |S'), 'the stray S survived');
});

test('section names are localised but episode titles are not', () => {
  const en = renderPodcast(sections, 'en');
  const ru = renderPodcast(sections, 'ru');
  assert.match(en, /Analytics and data/);
  assert.match(ru, /Аналитика и данные/);
  assert.match(en, /Аналитик Иван/);
  assert.match(ru, /Аналитик Иван/);
});

test('every episode is linked', () => {
  const page = renderPodcast(sections, 'en');
  for (const section of sections) {
    for (const episode of section.episodes) {
      assert.ok(page.includes(`href="${episode.url}"`), `${episode.url} not linked`);
    }
  }
});

test('is a complete document', () => {
  assert.match(renderPodcast(sections, 'ru'), /^<!doctype html>/);
});
