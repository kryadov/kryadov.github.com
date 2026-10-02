import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, slugify } from '../src/markdown.mjs';

test('gives every heading an id derived from its text', () => {
  assert.match(renderMarkdown('## Why microservices'), /<h2 id="why-microservices">Why microservices/);
  assert.match(renderMarkdown('### 3.1. AWS: the widest choice'), /<h3 id="31-aws-the-widest-choice">/);
});

test('keeps cyrillic in heading ids', () => {
  assert.match(renderMarkdown('## 6.1. Китай: Alibaba Cloud'), /<h2 id="61-китай-alibaba-cloud">/);
});

test('strips inline markup and html out of the id, not out of the heading', () => {
  const html = renderMarkdown('## The **bold** `code` <a id="x"></a>part');
  assert.match(html, /<h2 id="the-bold-code-part">/);
  assert.match(html, /<strong>bold<\/strong>/);
});

test('numbers repeated headings within one document, and only within it', () => {
  const html = renderMarkdown('## Notes\n\n## Notes\n\n## Notes');
  assert.deepEqual([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]), ['notes', 'notes-1', 'notes-2']);
  assert.match(renderMarkdown('## Notes'), /id="notes"/);
});

test('each heading carries a # link to itself, kept out of the reading order', () => {
  const html = renderMarkdown('## Why microservices');
  assert.match(
    html,
    /<h2 id="why-microservices">Why microservices <a class="heading-anchor" href="#why-microservices" aria-hidden="true" tabindex="-1">#<\/a><\/h2>/,
  );
});

test('slugify collapses punctuation and whitespace into single hyphens', () => {
  assert.equal(slugify('  Hello,   World — again!  '), 'hello-world-again');
  assert.equal(slugify('TL;DR'), 'tldr');
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
