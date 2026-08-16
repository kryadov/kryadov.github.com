import { escapeHtml } from '../html.mjs';
import { t } from '../i18n.mjs';
import { SITE_URL, pagePath, feedPath } from './layout.mjs';

// Atom rather than RSS: stricter, shorter, and assembled without a library. One
// feed per locale, each holding only that locale's text — a reader subscribes to
// a language, not to a site.

// The posts carry a date and no time, and Atom wants a timestamp. Midnight UTC
// is the honest reading of "published on that day".
function stamp(date) {
  return `${date}T00:00:00Z`;
}

function absolute(path) {
  return `${SITE_URL}${path}`;
}

function entry(post, locale) {
  const text = post[locale];
  const url = absolute(pagePath(locale, 'blog', post));
  return `  <entry>
    <title>${escapeHtml(text.title)}</title>
    <link rel="alternate" href="${url}" />
    <id>${url}</id>
    <updated>${stamp(post.date)}</updated>
    <summary>${escapeHtml(text.summary)}</summary>
  </entry>`;
}

export function renderFeed(posts, locale) {
  const list = absolute(pagePath(locale, 'blog'));
  // Dated by the newest post. With no posts at all there is nothing to date it
  // by, and the epoch is the one value that cannot be mistaken for a real one.
  const updated = stamp(posts.length > 0 ? posts[0].date : '1970-01-01');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${locale}">
  <title>${escapeHtml(t(locale, 'site.title.blog'))}</title>
  <subtitle>${escapeHtml(t(locale, 'site.description.blog'))}</subtitle>
  <link rel="alternate" href="${list}" />
  <link rel="self" href="${absolute(feedPath(locale))}" />
  <id>${list}</id>
  <updated>${updated}</updated>
  <author>
    <name>${escapeHtml(t(locale, 'site.name'))}</name>
  </author>
${posts.map((post) => entry(post, locale)).join('\n')}
</feed>
`;
}
