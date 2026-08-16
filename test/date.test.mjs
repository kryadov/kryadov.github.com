import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from '../src/render/date.mjs';

test('spells the month out in english', () => {
  assert.equal(formatDate('en', '2026-08-16'), '16 August 2026');
});

test('spells the month out in russian, without the "г." tail', () => {
  assert.equal(formatDate('ru', '2026-08-16'), '16 августа 2026');
});

test('the day does not slip across a timezone', () => {
  // Parsed as UTC, formatted as UTC: the first of the month must stay the first
  // wherever the build runs.
  assert.equal(formatDate('en', '2026-01-01'), '1 January 2026');
  assert.equal(formatDate('ru', '2026-12-31'), '31 декабря 2026');
});
