import { html } from '../html.mjs';
import { t } from '../i18n.mjs';
import { layout } from './layout.mjs';

function table(section, locale) {
  return html`
    <h3>${section.name[locale]}</h3>
    <table class="podcast__table">
      <thead>
        <tr>
          <th>${t(locale, 'podcast.season')}</th>
          <th>${t(locale, 'podcast.episode')}</th>
          <th>${t(locale, 'podcast.date')}</th>
          <th>${t(locale, 'podcast.listen')}</th>
          <th>${t(locale, 'podcast.length')}</th>
        </tr>
      </thead>
      <tbody>
        ${section.episodes.map(
          (episode) => html`
            <tr>
              <td>${episode.season}</td>
              <td>${episode.episode ?? '—'}</td>
              <td>${episode.date}</td>
              <td><a href="${episode.url}">${episode.title}</a></td>
              <td>${episode.length}</td>
            </tr>
          `,
        )}
      </tbody>
    </table>
  `;
}

export function renderPodcast(sections, locale) {
  const body = html`
    <main id="content">
      <h2 class="section__heading">${t(locale, 'heading.podcast')}</h2>
      ${sections.map((section) => table(section, locale))}
    </main>
  `;
  return layout({
    locale,
    page: 'podcast',
    title: t(locale, 'site.title.podcast'),
    description: t(locale, 'site.description.podcast'),
    body,
  });
}
