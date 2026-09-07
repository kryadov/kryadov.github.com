# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A bilingual static site generator, hand-written, for kryadov.github.io. No framework, no bundler; the only runtime
dependency is `marked`. Node >= 22, ESM everywhere (`.mjs`).

## Commands

```
npm run build                     # build.mjs → dist/ (wipes dist/ first)
npm test                          # node --test over test/*.test.mjs
node --test test/posts.test.mjs   # one file
node --test --test-name-pattern 'front matter'   # one test by name
node scripts/sync-podcast.mjs                    # dry run: report drift vs the mave API
node scripts/sync-podcast.mjs --apply            # write podcast.json corrections
node scripts/sync-descriptions.mjs [--apply]     # push works.json summaries to GitHub repo descriptions
```

Deployment is automatic: a push to `main` runs `.github/workflows/pages.yml`, which runs `npm test`, `npm run build`
and publishes `dist/` to GitHub Pages. There is no dev server — build and open `dist/` files.

## Architecture

**Content is data, validated at load time.** `works.json`, `lab.json`, `podcast.json`, `music.json` and `posts/*.md`
live at the repository root and are the only content sources. `loadWorks` (`src/data.mjs`) and `loadPosts`
(`src/posts.mjs`) collect *all* validation errors and throw one aggregated message rather than failing on the first —
a malformed entry breaks the build, deliberately, instead of producing a silently wrong page.

**Every page exists twice.** `LOCALES = ['en', 'ru']` drives the whole build loop in `build.mjs`. English lives at the
root, Russian under `/ru/`. UI strings are in `src/i18n.mjs`; `t(locale, key)` throws on a missing key, so adding a
string means adding it to both tables.

**`src/render/layout.mjs` owns the URL shape.** `pagePath` (what a link says), `outputPath` (where the file is written)
and `feedPath`/`feedOutputPath` are the single source of truth for addresses, including the `/blog/YYYY/MM/slug/` shape
derived from a post's date. Change URLs there and nowhere else. It also owns the `<head>`, nav and footer;
`PAGES` lists what appears in the navigation (`lab` is built but intentionally not listed).

**`src/html.mjs` is the templating.** The `html` tagged template escapes every interpolation and returns a `Raw` object,
which is why nested ``html`...` `` composes without double-escaping. Arrays render by concatenation; `null`/`undefined`/
`false` render as nothing. Use `raw()` only for HTML you produced deliberately.

**One renderer per page** in `src/render/`, each returning a full document via `layout()`. `card.mjs` and `row.mjs` are
the shared work-entry components; `blog.mjs` exports `postItem`, reused on the home page's "latest posts" block.

**`src/markdown.mjs` is the only module that knows `marked` exists.** Raw HTML in posts passes through unsanitised on
purpose — posts are hand-written here and reviewed in the commit that adds them.

**`src/assets.mjs`** appends a content-hash `?v=` to `/assets/*` URLs; without it a deploy can land new HTML against a
browser-cached old stylesheet. **`src/cover.mjs`** generates a deterministic SVG cover from a seeded PRNG when a work
has no `cover`, so the same entry always looks the same.

## Adding a blog post

Two files, both required — a missing translation fails the build:

```
posts/<YYYY-MM-DD>-<slug>.en.md
posts/<YYYY-MM-DD>-<slug>.ru.md
```

Slug: lowercase letters, digits, single hyphens; the same slug must carry the same date in both files. Front matter is
a deliberately minimal `key: value` parser, not YAML — `summary` is the only accepted key, and an unknown key is an
error rather than a silently dropped field. Without it the summary is derived from the first paragraph and truncated to
200 characters. The body must contain an `# h1`, which is cut out and used as the title (the page prints its own).

## This repository is public

`dist/` is served verbatim from the branch root, so anything committed here is published. Specifications, plans and the
`private-NN` → real-repository mapping live in the *private* `kryadov/site-docs` repository, checked out beside this
one (`../site-docs`, override with `PRIVATE_REPOS`); `docs/`, `specs/`, `plans/` and `private-repos.json` are
gitignored. `PASSTHROUGH` in `build.mjs` is the list of directories copied verbatim — never add anything to it that is
not meant to be public. `test/build.test.mjs` enforces this: it asserts no `docs`/`specs`/`plans` reach the output, that
private works never emit a `github.com/kryadov/<id>` link, and — when the mapping is present locally — that no real
private repository name appears in any tracked file. That last test skips in CI, where the mapping is absent.

## Conventions

Comments in this codebase explain *why*, often at length, and several encode a decision that a future change would
silently undo (the `PASSTHROUGH` warning, the ENOENT-tolerant `loadPosts`, the cache-busting rationale). Read them
before changing the code they sit on. Tests are `node:test` + `node:assert/strict`, one file per module, and
`assets/filter.js` is tested by evaluating the source against a stub `window` rather than in a browser.
