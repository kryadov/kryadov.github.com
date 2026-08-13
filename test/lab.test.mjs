import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderLab } from '../src/render/lab.mjs';

const items = JSON.parse(await readFile('lab.json', 'utf8'));

test('lab.json entries all carry both locales and an href', () => {
  for (const item of items) {
    assert.match(item.href, /^\//, `${item.href} must be absolute`);
    for (const locale of ['en', 'ru']) {
      assert.ok(item.title[locale], `missing title.${locale}`);
      assert.ok(item.note[locale], `missing note.${locale}`);
    }
  }
});

test('every item is linked from the page', () => {
  const page = renderLab(items, 'en');
  for (const item of items) {
    assert.ok(page.includes(`href="${item.href}"`), `${item.href} not linked`);
  }
});

test('renders in the requested locale', () => {
  assert.match(renderLab(items, 'ru'), /Набор спиралей/);
  assert.match(renderLab(items, 'en'), /Spiral set/);
});

test('is a complete document', () => {
  assert.match(renderLab(items, 'en'), /^<!doctype html>/);
});
