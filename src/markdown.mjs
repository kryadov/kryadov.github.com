import { Marked } from 'marked';

// The only module in the project that knows the library exists. Everything else
// sees renderMarkdown() and nothing more, so swapping the library is one file.
//
// gfm: tables and fenced code, which the posts use.
// async: false guarantees a string back rather than a promise.
//
// Raw HTML passes through unsanitised on purpose: the posts are written by hand
// in this repository and reviewed in the commit that adds them. A sanitiser here
// would only protect the author from himself, at the price of quietly eating his
// own markup.

// Every heading gets an id, so a long read can carry a table of contents and any
// section can be linked to. Headings used to carry none: marked dropped its old
// headerIds option and nothing replaced it. The long reads needed anchors, and
// writing them into each heading by hand as inline HTML was the stopgap this
// replaces.
//
// The id follows the GitHub convention: lower case, punctuation dropped, spaces
// to hyphens. Letters are kept in any script, so a Russian heading gets a
// Cyrillic id; browsers percent-encode it in the address bar and resolve it.
export function slugify(text) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

// What the reader sees, minus markup: the id must not depend on whether a word
// was bold, or on a stray inline tag.
function plainText(raw) {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '');
}

// Ids must be unique within a page, not across pages, so the record of what has
// been handed out lives for exactly one renderMarkdown() call. That is safe
// because rendering is synchronous.
let taken = new Map();

function uniqueId(text) {
  const base = slugify(plainText(text)) || 'section';
  const seen = taken.get(base) ?? 0;
  taken.set(base, seen + 1);
  return seen === 0 ? base : `${base}-${seen}`;
}

const marked = new Marked({
  gfm: true,
  async: false,
  renderer: {
    heading({ tokens, depth, text }) {
      return `<h${depth} id="${uniqueId(text)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },
  },
});

export function renderMarkdown(text) {
  taken = new Map();
  return marked.parse(text);
}
