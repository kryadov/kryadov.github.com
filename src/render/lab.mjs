import { html } from '../html.mjs';
import { t } from '../i18n.mjs';
import { layout } from './layout.mjs';

export function renderLab(items, locale) {
  const body = html`
    <main id="content">
      <h2 class="section__heading">${t(locale, 'heading.lab')}</h2>
      <div class="lab__grid">
        ${items.map(
          (item) => html`
            <a class="lab__item" href="${item.href}">
              <h3>${item.title[locale]}</h3>
              <p>${item.note[locale]}</p>
            </a>
          `,
        )}
      </div>
    </main>
  `;
  return layout({
    locale,
    page: 'lab',
    title: t(locale, 'site.title.lab'),
    description: t(locale, 'site.description.lab'),
    body,
  });
}
