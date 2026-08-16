import { html } from '../html.mjs';
import { t } from '../i18n.mjs';
import { layout, pagePath } from './layout.mjs';
import { formatDate } from './date.mjs';

// Exported because the home page shows the same three items in the same shape.
// No covers: the posts have none, and there is nothing to generate one from.
export function postItem(post, locale) {
  const text = post[locale];
  return html`
    <li class="blog__item">
      <time class="blog__date" datetime="${post.date}">${formatDate(locale, post.date)}</time>
      <h3 class="blog__title"><a href="${pagePath(locale, 'blog', post)}">${text.title}</a></h3>
      <p class="blog__summary">${text.summary}</p>
    </li>
  `;
}

export function renderBlog(posts, locale) {
  const body = html`
    <main id="content">
      <section id="blog" class="blog">
        <h2 class="section__heading">${t(locale, 'heading.blog')}</h2>
        ${posts.length === 0
          ? html`<p class="blog__empty">${t(locale, 'blog.empty')}</p>`
          : html`<ol class="blog__list">
              ${posts.map((post) => postItem(post, locale))}
            </ol>`}
      </section>
    </main>
  `;
  return layout({
    locale,
    page: 'blog',
    title: t(locale, 'site.title.blog'),
    description: t(locale, 'site.description.blog'),
    body,
  });
}
