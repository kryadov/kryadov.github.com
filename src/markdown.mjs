import { Marked } from 'marked';

// The only module in the project that knows the library exists. Everything else
// sees renderMarkdown() and nothing more, so swapping the library is one file.
//
// gfm: tables and fenced code, which the posts use.
// async: false guarantees a string back rather than a promise.
// Heading anchors and address mangling are off by default in current marked —
// the options that used to switch them were removed in v9, so there is nothing
// to pass here, only something not to reintroduce.
//
// Raw HTML passes through unsanitised on purpose: the posts are written by hand
// in this repository and reviewed in the commit that adds them. A sanitiser here
// would only protect the author from himself, at the price of quietly eating his
// own markup.
const marked = new Marked({ gfm: true, async: false });

export function renderMarkdown(text) {
  return marked.parse(text);
}
