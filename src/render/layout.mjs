import { html, raw } from '../html.mjs';
import { t } from '../i18n.mjs';
import { assetUrl } from '../assets.mjs';
import { LOCALES } from '../data.mjs';

// The pages the header links to. `/lab/` is deliberately absent: it is reached
// from its own hero card, not from the navigation. It is still built, still
// bilingual, and still the readable index for the sketches — see build.mjs.
export const PAGES = ['home', 'blog', 'podcast', 'music'];

// Atom demands absolute URLs, and so does anything that ever quotes a page.
export const SITE_URL = 'https://kryadov.github.io';

const GITHUB_URL = 'https://github.com/kryadov';
const TELEGRAM_URL = 'https://t.me/youshouldknowit';
const LINKEDIN_URL = 'https://www.linkedin.com/in/konstantin-ryadov/';

// A post is the one page whose address is not just its section: /blog/ holds a
// year and a month, taken from the post's own date. The day is on the page and
// in the feed — in the URL it would only make the line longer.
function segment(page, post) {
  if (page === 'home') return '';
  if (page === 'blog' && post) {
    const [year, month] = post.date.split('-');
    return `blog/${year}/${month}/${post.slug}/`;
  }
  return `${page}/`;
}

export function pagePath(locale, page, post) {
  const path = segment(page, post);
  return locale === 'en' ? `/${path}` : `/ru/${path}`;
}

export function outputPath(locale, page, post) {
  const path = segment(page, post);
  return locale === 'en' ? `${path}index.html` : `ru/${path}index.html`;
}

export function feedPath(locale) {
  return locale === 'en' ? '/blog/feed.xml' : '/ru/blog/feed.xml';
}

export function feedOutputPath(locale) {
  return locale === 'en' ? 'blog/feed.xml' : 'ru/blog/feed.xml';
}

function other(locale) {
  return locale === 'en' ? 'ru' : 'en';
}

function nav(locale, page, post) {
  return html`
    <nav class="nav" aria-label="${t(locale, 'nav.home')}">
      ${PAGES.map(
        (target) => html`<a
          class="nav__link${target === page ? ' nav__link--current' : ''}"
          href="${pagePath(locale, target)}"
          ${target === page ? raw('aria-current="page"') : null}
          >${t(locale, `nav.${target}`)}</a
        >`,
      )}
      <a class="nav__external" href="${GITHUB_URL}" rel="me">${t(locale, 'footer.github')}</a>
      <a class="nav__external" href="${TELEGRAM_URL}" rel="me">${t(locale, 'footer.telegram')}</a>
      <a class="nav__external" href="${LINKEDIN_URL}" rel="me">${t(locale, 'footer.linkedin')}</a>
      <a
        class="nav__lang"
        href="${pagePath(other(locale), page, post)}"
        hreflang="${other(locale)}"
        title="${t(locale, 'nav.language')}"
        >${other(locale).toUpperCase()}</a
      >
    </nav>
  `;
}

export function layout({ locale, page, title, description, body, post }) {
  return String(html`<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    ${LOCALES.map(
      (l) => html`<link rel="alternate" hreflang="${l}" href="${pagePath(l, page, post)}" />`,
    )}
    <link rel="alternate" type="application/atom+xml" href="${feedPath(locale)}" title="${t(locale, 'site.title.blog')}" />
    <link rel="stylesheet" href="${assetUrl('/assets/site.css')}" />
  </head>
  <body>
    <a class="skip" href="#content">${t(locale, 'nav.skip')}</a>
    <header class="header">
      <div class="header__identity">
        <img
          class="header__avatar"
          src="${assetUrl('/assets/avatar.jpg')}"
          width="40"
          height="40"
          alt=""
          decoding="async"
        />
        <span class="header__name">${t(locale, 'site.name')}</span>
        <span class="header__tagline">${t(locale, 'site.tagline')}</span>
      </div>
      ${nav(locale, page, post)}
    </header>
    ${raw(body)}
    <footer class="footer">
      <a href="${GITHUB_URL}">${t(locale, 'footer.github')}</a>
      <a href="${TELEGRAM_URL}">${t(locale, 'footer.telegram')}</a>
      <a href="${LINKEDIN_URL}">${t(locale, 'footer.linkedin')}</a>
      <a href="${`${GITHUB_URL}?tab=repositories`}">${t(locale, 'footer.allRepos')}</a>
    </footer>
  </body>
</html>
`);
}
