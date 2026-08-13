import { html, raw } from '../html.mjs';
import { t } from '../i18n.mjs';
import { coverSvg } from '../cover.mjs';

const GITHUB = 'https://github.com/kryadov';

function cover(work) {
  if (work.cover) {
    return html`<img class="card__cover" src="${work.cover}" alt="" loading="lazy" />`;
  }
  return html`<div class="card__cover">${raw(coverSvg(work.id, work.track))}</div>`;
}

function links(work, locale) {
  if (work.private) {
    return html`<span class="card__closed">${t(locale, 'card.closed')}</span>`;
  }
  return html`
    ${work.live
      ? html`<a class="card__action card__action--primary" href="${work.live}"
          >${t(locale, 'card.demo')}</a
        >`
      : null}
    ${work.repo
      ? html`<a class="card__action" href="${`${GITHUB}/${work.repo}`}"
          >${t(locale, 'card.code')}</a
        ><code class="card__repo">${work.repo}</code>`
      : null}
  `;
}

export function heroCard(work, locale) {
  return html`
    <article class="card card--${work.track}">
      ${cover(work)}
      <div class="card__body">
        <h3 class="card__title">
          ${work.title[locale]}
          ${work.live ? html`<span class="card__badge">${t(locale, 'card.live')}</span>` : null}
        </h3>
        <p class="card__summary">${work.summary[locale]}</p>
        ${work.private && work.detail
          ? html`<details class="card__details">
              <summary>${t(locale, 'card.details')}</summary>
              <p>${work.detail[locale]}</p>
            </details>`
          : null}
        <ul class="card__stack">
          ${work.stack.map((item) => html`<li>${item}</li>`)}
        </ul>
        <div class="card__foot">
          <span class="card__year">${work.year}</span>
          ${links(work, locale)}
        </div>
      </div>
    </article>
  `;
}
