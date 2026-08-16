import { html, raw } from '../html.mjs';
import { t } from '../i18n.mjs';
import { renderMarkdown } from '../markdown.mjs';
import { layout, pagePath } from './layout.mjs';
import { formatDate } from './date.mjs';

export function renderPost(post, locale) {
  const text = post[locale];
  const body = html`
    <main id="content">
      <article class="post">
        <p class="post__meta">
          <time datetime="${post.date}">${formatDate(locale, post.date)}</time>
        </p>
        <h1 class="post__title">${text.title}</h1>
        <div class="post__body">${raw(renderMarkdown(text.body))}</div>
        <p class="post__back"><a href="${pagePath(locale, 'blog')}">${t(locale, 'blog.back')}</a></p>
      </article>
    </main>
  `;
  return layout({
    locale,
    page: 'blog',
    post,
    // Not a t() key: every post has its own, and there is nothing to translate
    // but the name after the dash.
    title: `${text.title} — ${t(locale, 'site.name')}`,
    description: text.summary,
    body,
  });
}
