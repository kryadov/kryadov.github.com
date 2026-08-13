import { html, raw } from '../html.mjs';
import { t } from '../i18n.mjs';
import { LOCALES } from '../data.mjs';

// The pages the header links to. `/lab/` is deliberately absent: it is reached
// from its own hero card, not from the navigation. It is still built, still
// bilingual, and still the readable index for the sketches — see build.mjs.
export const PAGES = ['home', 'podcast', 'music'];

const GITHUB_URL = 'https://github.com/kryadov';
const TELEGRAM_URL = 'https://t.me/youshouldknowit';

export function pagePath(locale, page) {
  const segment = page === 'home' ? '' : `${page}/`;
  return locale === 'en' ? `/${segment}` : `/ru/${segment}`;
}

export function outputPath(locale, page) {
  const segment = page === 'home' ? '' : `${page}/`;
  return locale === 'en' ? `${segment}index.html` : `ru/${segment}index.html`;
}

function other(locale) {
  return locale === 'en' ? 'ru' : 'en';
}

function nav(locale, page) {
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
      <a
        class="nav__lang"
        href="${pagePath(other(locale), page)}"
        hreflang="${other(locale)}"
        title="${t(locale, 'nav.language')}"
        >${other(locale).toUpperCase()}</a
      >
    </nav>
  `;
}

export function layout({ locale, page, title, description, body }) {
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
      (l) => html`<link rel="alternate" hreflang="${l}" href="${pagePath(l, page)}" />`,
    )}
    <link rel="stylesheet" href="/assets/site.css" />
  </head>
  <body>
    <a class="skip" href="#content">${t(locale, 'nav.skip')}</a>
    <header class="header">
      <div class="header__identity">
        <span class="header__name">${t(locale, 'site.name')}</span>
        <span class="header__tagline">${t(locale, 'site.tagline')}</span>
      </div>
      ${nav(locale, page)}
    </header>
    ${raw(body)}
    <footer class="footer">
      <a href="${GITHUB_URL}">${t(locale, 'footer.github')}</a>
      <a href="${TELEGRAM_URL}">${t(locale, 'footer.telegram')}</a>
      <a href="${`${GITHUB_URL}?tab=repositories`}">${t(locale, 'footer.allRepos')}</a>
    </footer>
  </body>
</html>
`);
}
