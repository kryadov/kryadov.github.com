import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, LOCALES, validateWorks } from '../src/data.mjs';

const valid = {
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

test('exposes the five tracks and two locales', () => {
  assert.deepEqual(TRACKS, ['ai', 'jvm', 'interactive', 'teaching', 'medicine']);
  assert.deepEqual(LOCALES, ['en', 'ru']);
});

test('accepts a well-formed entry', () => {
  assert.deepEqual(validateWorks([valid]), []);
});

test('rejects an unknown track', () => {
  const errors = validateWorks([{ ...valid, track: 'misc' }]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /track/);
});

test('rejects a duplicate id', () => {
  const errors = validateWorks([valid, valid]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /duplicate/);
});

test('rejects a private entry that still carries a repo', () => {
  const errors = validateWorks([
    { ...valid, private: true, repo: 'race-the-city', detail: { en: 'x', ru: 'x' } },
  ]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /repo must be null/);
});

test('requires detail on private entries', () => {
  const errors = validateWorks([{ ...valid, private: true, repo: null, detail: null }]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /detail/);
});

test('requires both locales in every text field', () => {
  const errors = validateWorks([{ ...valid, summary: { en: 'only english', ru: '' } }]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /summary\.ru/);
});
