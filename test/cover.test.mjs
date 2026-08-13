import test from 'node:test';
import assert from 'node:assert/strict';
import { coverSvg, hash32, TRACK_HUE } from '../src/cover.mjs';
import { TRACKS } from '../src/data.mjs';

test('every track has a hue', () => {
  for (const track of TRACKS) {
    assert.equal(typeof TRACK_HUE[track], 'number', `missing hue for ${track}`);
  }
});

test('hashing is stable and differs between inputs', () => {
  assert.equal(hash32('race-the-city'), hash32('race-the-city'));
  assert.notEqual(hash32('race-the-city'), hash32('art-morph'));
});

test('the same id and track always produce the same svg', () => {
  assert.equal(coverSvg('art-morph', 'interactive'), coverSvg('art-morph', 'interactive'));
});

test('different ids produce different svgs', () => {
  assert.notEqual(coverSvg('art-morph', 'interactive'), coverSvg('labyrinth7', 'interactive'));
});

test('different tracks produce different svgs', () => {
  assert.notEqual(coverSvg('same-id', 'ai'), coverSvg('same-id', 'jvm'));
});

test('an unknown track is rejected', () => {
  assert.throws(() => coverSvg('x', 'misc'), /unknown track/);
});

test('output is a self-contained svg element', () => {
  const svg = coverSvg('race-the-city', 'interactive');
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<\/svg>$/);
  assert.match(svg, /aria-hidden="true"/);
});

test('every drawn coordinate stays inside the viewBox', () => {
  const svg = coverSvg('race-the-city', 'interactive', { width: 640, height: 360 });
  for (const match of svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)) {
    const [, cx, cy, r] = match.map(Number);
    assert.ok(cx - r > -40 && cx + r < 680, `cx ${cx} r ${r} out of range`);
    assert.ok(cy - r > -40 && cy + r < 400, `cy ${cy} r ${r} out of range`);
  }
});
