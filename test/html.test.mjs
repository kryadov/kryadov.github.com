import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, html, raw } from '../src/html.mjs';

test('escapes the five dangerous characters', () => {
  assert.equal(escapeHtml(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

test('interpolated values are escaped', () => {
  assert.equal(String(html`<p>${'<script>'}</p>`), '<p>&lt;script&gt;</p>');
});

test('raw values are not escaped', () => {
  assert.equal(String(html`<p>${raw('<svg/>')}</p>`), '<p><svg/></p>');
});

test('arrays are joined without separators', () => {
  assert.equal(String(html`${['a', 'b', 'c']}`), 'abc');
});

test('null, undefined and false render as nothing', () => {
  assert.equal(String(html`[${null}${undefined}${false}]`), '[]');
});

test('zero renders as zero', () => {
  assert.equal(String(html`${0}`), '0');
});

test('a nested template composes instead of being escaped', () => {
  const link = html`<a href="${'https://example.org/?a=1&b=2'}">go</a>`;
  const page = html`<p>${link}</p>`;
  assert.equal(String(page), '<p><a href="https://example.org/?a=1&amp;b=2">go</a></p>');
});

test('nesting survives an array and a conditional', () => {
  const items = ['a', 'b'].map((x) => html`<li>${x}</li>`);
  const out = html`<ul>${items}${false}${null}</ul>`;
  assert.equal(String(out), '<ul><li>a</li><li>b</li></ul>');
});
