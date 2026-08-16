import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/markdown.mjs';

test('renders headings without anchor ids', () => {
  const html = renderMarkdown('## Why microservices');
  assert.match(html, /<h2[^>]*>Why microservices<\/h2>/);
  assert.ok(!html.includes('id="'), 'headings must carry no generated id');
});

test('renders paragraphs, emphasis and links', () => {
  const html = renderMarkdown('A **bold** claim and a [link](https://example.com).');
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<a href="https:\/\/example\.com">link<\/a>/);
});

test('renders unordered and ordered lists', () => {
  assert.match(renderMarkdown('- one\n- two'), /<ul>\s*<li>one<\/li>/);
  assert.match(renderMarkdown('1. one\n2. two'), /<ol>\s*<li>one<\/li>/);
});

test('renders fenced code, escaped, inside pre', () => {
  const html = renderMarkdown('```java\nList<String> xs;\n```');
  assert.match(html, /<pre><code class="language-java">/);
  assert.match(html, /List&lt;String&gt; xs;/);
});

test('renders gfm tables', () => {
  const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
  assert.match(html, /<table>/);
  assert.match(html, /<th>a<\/th>/);
  assert.match(html, /<td>1<\/td>/);
});

test('renders blockquotes', () => {
  assert.match(renderMarkdown('> quoted'), /<blockquote>/);
});

test('lets raw html through — the content is ours', () => {
  assert.match(renderMarkdown('<figure>x</figure>'), /<figure>x<\/figure>/);
});

test('returns a string, never a promise', () => {
  assert.equal(typeof renderMarkdown('hi'), 'string');
});
