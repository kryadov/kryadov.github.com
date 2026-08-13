import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function stubRow(track, lang) {
  return {
    hidden: false,
    attrs: { 'data-track': track, 'data-lang': lang },
    getAttribute(name) {
      return this.attrs[name];
    },
  };
}

const source = await readFile('assets/filter.js', 'utf8');
const windowStub = {};
new Function('window', 'document', source)(windowStub, undefined);
const applyFilter = windowStub.__applyFilter;

test('the script exposes its filter function', () => {
  assert.equal(typeof applyFilter, 'function');
});

test('an empty state shows everything', () => {
  const rows = [stubRow('ai', 'Python'), stubRow('jvm', 'Java')];
  const empty = { hidden: false };
  assert.equal(applyFilter({ track: '', lang: '' }, rows, empty), 2);
  assert.deepEqual(rows.map((r) => r.hidden), [false, false]);
  assert.equal(empty.hidden, true);
});

test('filtering by track hides the others', () => {
  const rows = [stubRow('ai', 'Python'), stubRow('jvm', 'Java')];
  assert.equal(applyFilter({ track: 'jvm', lang: '' }, rows, null), 1);
  assert.deepEqual(rows.map((r) => r.hidden), [true, false]);
});

test('track and language combine', () => {
  const rows = [stubRow('ai', 'Python'), stubRow('ai', 'Java')];
  assert.equal(applyFilter({ track: 'ai', lang: 'Java' }, rows, null), 1);
  assert.deepEqual(rows.map((r) => r.hidden), [true, false]);
});

test('a combination matching nothing reveals the empty notice', () => {
  const rows = [stubRow('ai', 'Python')];
  const empty = { hidden: true };
  assert.equal(applyFilter({ track: 'jvm', lang: 'Java' }, rows, empty), 0);
  assert.equal(empty.hidden, false);
});
