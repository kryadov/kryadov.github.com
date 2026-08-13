import test from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, t } from '../src/i18n.mjs';
import { LOCALES, TRACKS } from '../src/data.mjs';

test('both locales define exactly the same keys', () => {
  const [first, ...rest] = LOCALES.map((l) => Object.keys(STRINGS[l]).sort());
  for (const keys of rest) assert.deepEqual(keys, first);
});

test('every track has a localised name in both locales', () => {
  for (const locale of LOCALES) {
    for (const track of TRACKS) {
      assert.equal(typeof t(locale, `track.${track}`), 'string');
    }
  }
});

test('no string is empty', () => {
  for (const locale of LOCALES) {
    for (const [key, value] of Object.entries(STRINGS[locale])) {
      assert.notEqual(value.trim(), '', `${locale}.${key} is empty`);
    }
  }
});

test('an unknown key throws rather than rendering undefined', () => {
  assert.throws(() => t('en', 'nope'), /missing string/);
});

test('an unknown locale throws', () => {
  assert.throws(() => t('de', 'live'), /unknown locale/);
});
