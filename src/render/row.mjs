import { html } from '../html.mjs';
import { t } from '../i18n.mjs';

const GITHUB = 'https://github.com/kryadov';

export function rowLanguage(work) {
  return work.stack.length > 0 ? work.stack[0] : 'other';
}

function actions(work, locale) {
  if (work.private) {
    return html`<span class="row__closed">${t(locale, 'card.closed')}</span>`;
  }
  return html`
    ${work.live ? html`<a class="row__link" href="${work.live}">${t(locale, 'card.demo')}</a>` : null}
    ${work.repo
      ? html`<a class="row__link" href="${`${GITHUB}/${work.repo}`}">${t(locale, 'card.code')}</a>`
      : null}
  `;
}

export function catalogueRow(work, locale) {
  return html`
    <li class="row" data-track="${work.track}" data-lang="${rowLanguage(work)}">
      <div class="row__main">
        <h4 class="row__title">${work.title[locale]}</h4>
        <p class="row__summary">${work.summary[locale]}</p>
        ${work.private && work.detail
          ? html`<details class="row__details">
              <summary>${t(locale, 'card.details')}</summary>
              <p>${work.detail[locale]}</p>
            </details>`
          : null}
      </div>
      <div class="row__meta">
        <span class="row__year">${work.year}</span>
        <span class="row__lang">${rowLanguage(work)}</span>
        ${actions(work, locale)}
      </div>
    </li>
  `;
}
