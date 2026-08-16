import { html } from '../html.mjs';
import { t } from '../i18n.mjs';
import { assetUrl } from '../assets.mjs';
import { TRACKS } from '../data.mjs';
import { layout, pagePath } from './layout.mjs';
import { heroCard } from './card.mjs';
import { catalogueRow, rowLanguage } from './row.mjs';
import { postItem } from './blog.mjs';

export function catalogueLanguages(works) {
  const seen = [];
  for (const work of works) {
    if (work.hero) continue;
    const language = rowLanguage(work);
    if (!seen.includes(language)) seen.push(language);
  }
  return seen;
}

function filterBar(works, locale) {
  const languages = catalogueLanguages(works);
  const tracks = TRACKS.filter((track) => works.some((w) => !w.hero && w.track === track));
  return html`
    <form class="filter" data-filter hidden>
      <fieldset class="filter__group">
        <legend>${t(locale, 'filter.track')}</legend>
        <button type="button" class="filter__chip is-on" data-filter-track="">
          ${t(locale, 'filter.all')}
        </button>
        ${tracks.map(
          (track) => html`<button type="button" class="filter__chip" data-filter-track="${track}">
            ${t(locale, `track.${track}`)}
          </button>`,
        )}
      </fieldset>
      <fieldset class="filter__group">
        <legend>${t(locale, 'filter.language')}</legend>
        <button type="button" class="filter__chip is-on" data-filter-lang="">
          ${t(locale, 'filter.all')}
        </button>
        ${languages.map(
          (language) => html`<button type="button" class="filter__chip" data-filter-lang="${language}">
            ${language}
          </button>`,
        )}
      </fieldset>
    </form>
    <p class="filter__empty" data-filter-empty hidden>${t(locale, 'filter.empty')}</p>
  `;
}

function catalogueSection(works, locale) {
  const groups = TRACKS.map((track) => ({
    track,
    rows: works.filter((work) => !work.hero && work.track === track),
  })).filter((group) => group.rows.length > 0);

  return html`
    ${groups.map(
      (group) => html`
        <section class="catalogue__group" data-track-group="${group.track}">
          <h3 class="catalogue__heading">${t(locale, `track.${group.track}`)}</h3>
          <ul class="catalogue__list">
            ${group.rows.map((work) => catalogueRow(work, locale))}
          </ul>
        </section>
      `,
    )}
  `;
}

// Trimming to three is the caller's job: this renders what it is handed. With
// nothing to hand it, the whole block disappears rather than leaving a heading
// over an empty list.
function latestSection(latest, locale) {
  if (latest.length === 0) return null;
  return html`
    <section id="latest" class="latest">
      <h2 class="section__heading">${t(locale, 'heading.latest')}</h2>
      <ol class="blog__list">${latest.map((post) => postItem(post, locale))}</ol>
      <p class="latest__all"><a href="${pagePath(locale, 'blog')}">${t(locale, 'blog.all')}</a></p>
    </section>
  `;
}

export function renderHome(works, locale, latest = []) {
  const heroes = works.filter((work) => work.hero);
  const body = html`
    <main id="content">
      <p class="intro">${t(locale, 'home.intro')}</p>
      ${latestSection(latest, locale)}
      <section id="heroes" class="heroes">
        <h2 class="section__heading">${t(locale, 'heading.heroes')}</h2>
        <div class="heroes__grid">${heroes.map((work) => heroCard(work, locale))}</div>
      </section>
      <section id="catalogue" class="catalogue">
        <h2 class="section__heading">${t(locale, 'heading.catalogue')}</h2>
        ${filterBar(works, locale)} ${catalogueSection(works, locale)}
      </section>
    </main>
    <script src="${assetUrl('/assets/filter.js')}" defer></script>
  `;
  return layout({
    locale,
    page: 'home',
    title: t(locale, 'site.title.home'),
    description: t(locale, 'site.description.home'),
    body,
  });
}
