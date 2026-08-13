import { html } from '../html.mjs';
import { t } from '../i18n.mjs';
import { layout } from './layout.mjs';

// Every release resolves through one smart link, which fans out to whichever
// streaming service the visitor uses. There is nothing to host here and nothing
// to embed — the page is a list of doors.
export const ARTIST = 'PERSONAL ANIMOSITY';

export function renderMusic(releases, locale) {
  const body = html`
    <main id="content">
      <h2 class="section__heading">${t(locale, 'heading.music')}</h2>
      <p class="music__lead">${t(locale, 'music.lead')}</p>
      <ul class="music__grid">
        ${releases.map(
          (release) => html`
            <li class="music__item">
              <a class="music__link" href="${release.url}">${release.title}</a>
            </li>
          `,
        )}
      </ul>
    </main>
  `;
  return layout({
    locale,
    page: 'music',
    title: t(locale, 'site.title.music'),
    description: t(locale, 'site.description.music'),
    body,
  });
}
