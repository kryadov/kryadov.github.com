import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LOCALES } from './data.mjs';

// The loader knows the shape of posts/ and nothing about HTML. `body` comes out
// as Markdown; turning it into HTML is the renderer's job, so this module never
// imports marked.

const FILE_NAME = /^(\d{4}-\d{2}-\d{2})-(.+)\.(en|ru)\.md$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KNOWN_KEYS = ['summary'];
const SUMMARY_LIMIT = 200;

export function parseFileName(name) {
  const match = FILE_NAME.exec(name);
  if (!match) return null;
  const [, date, slug, locale] = match;
  return { date, slug, locale };
}

function isRealDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

// Not YAML, and not pretending to be: `key: value`, one per line, no quoting and
// no nesting. A real parser would be two dependencies for one string field.
function splitFrontMatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return { data: {}, body: text };

  let close = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      close = i;
      break;
    }
  }
  if (close === -1) throw new Error('front matter is not closed by ---');

  const data = {};
  for (const line of lines.slice(1, close)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const colon = trimmed.indexOf(':');
    if (colon === -1) throw new Error(`front matter line is not key: value — ${trimmed}`);
    const key = trimmed.slice(0, colon).trim();
    // A typo must not become a silently missing summary.
    if (!KNOWN_KEYS.includes(key)) throw new Error(`unknown front matter key: ${key}`);
    data[key] = trimmed.slice(colon + 1).trim();
  }
  return { data, body: lines.slice(close + 1).join('\n') };
}

// The title is cut out, not just read: the page prints its own <h1>, and leaving
// the heading in the body would render it twice.
function takeTitle(text) {
  const lines = text.split('\n');
  const index = lines.findIndex((line) => /^#\s+\S/.test(line));
  if (index === -1) throw new Error('body has no # h1 to use as the title');
  const title = lines[index].replace(/^#\s+/, '').trim();
  lines.splice(index, 1);
  return { title, body: lines.join('\n').trim() };
}

// The URL in parens may itself contain one level of nested parens (Wikipedia
// links, parenthetical citations); a bare [^)]* stops at the first ) and
// garbles the surrounding text, so one level of nesting is tolerated here.
const PAREN_URL = '(?:[^()]|\\([^()]*\\))*';
const IMAGE = new RegExp(`!\\[[^\\]]*\\]\\(${PAREN_URL}\\)`, 'g');
const LINK = new RegExp(`\\[([^\\]]*)\\]\\(${PAREN_URL}\\)`, 'g');

function stripInline(text) {
  return text
    .replace(IMAGE, '')
    .replace(LINK, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstParagraph(body) {
  for (const block of body.split(/\n{2,}/)) {
    const text = stripInline(block.replace(/^>\s?/gm, '').trim());
    if (text !== '') return text;
  }
  return '';
}

export function truncate(text, limit = SUMMARY_LIMIT) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const space = cut.lastIndexOf(' ');
  const kept = space === -1 ? cut : cut.slice(0, space);
  return `${kept.replace(/[\s.,;:!?—-]+$/, '')}…`;
}

export function parsePost(text) {
  // Normalised first: a CRLF checkout must not change what the parser sees.
  const { data, body: withTitle } = splitFrontMatter(text.replace(/\r\n/g, '\n'));
  const { title, body } = takeTitle(withTitle);
  if (body === '') throw new Error('body is empty once the title is removed');
  const summary = data.summary ?? truncate(firstParagraph(body));
  if (summary === '') throw new Error('no summary, and no paragraph to derive one from');
  return { title, summary, body };
}

export async function loadPosts(dir = 'posts') {
  const names = (await readdir(dir)).sort();
  const errors = [];
  const bySlug = new Map();

  for (const name of names) {
    const at = `${dir}/${name}`;
    const parsed = parseFileName(name);
    if (!parsed) {
      errors.push(`${at}: name must be <YYYY-MM-DD>-<slug>.<en|ru>.md`);
      continue;
    }
    const { date, slug, locale } = parsed;
    if (!SLUG.test(slug)) {
      errors.push(`${at}: slug ${slug} must be lowercase letters, digits and single hyphens`);
      continue;
    }
    if (!isRealDate(date)) {
      errors.push(`${at}: ${date} is not a date on the calendar`);
      continue;
    }

    let post = bySlug.get(slug);
    if (!post) {
      post = { slug, date };
      bySlug.set(slug, post);
    }
    if (post.date !== date) {
      errors.push(`${at}: slug ${slug} already carries the date ${post.date}`);
      continue;
    }

    try {
      const contents = await readFile(join(dir, name), 'utf8');
      post[locale] = { ...parsePost(contents), source: at };
    } catch (error) {
      // Mark the slot as attempted-and-failed, so the pairing check below does
      // not add "missing translation" on top of the real complaint.
      post[locale] = null;
      errors.push(`${at}: ${error.message}`);
    }
  }

  for (const post of bySlug.values()) {
    for (const locale of LOCALES) {
      if (!(locale in post)) {
        errors.push(`${dir}/${post.date}-${post.slug}.${locale}.md: the translation is missing`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`${dir}/ is invalid:\n  ${errors.join('\n  ')}`);
  }

  return [...bySlug.values()].sort((a, b) =>
    a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date),
  );
}
