// Rebuilds podcast.json from the podcast platform's own API.
//
// Two things on this page are the site's own and the API knows nothing about
// them: the grouping by topic, which the spec requires, and the readable
// episode titles — the platform's titles are phonetic transcriptions meant to
// be read aloud by an audio directory ("хэтэмээля" for HTML). So this is a
// merge, not an overwrite: the existing podcast.json supplies topic and title,
// the API supplies season, date, length and link.
//
//   node scripts/sync-podcast.mjs                      dry run, reports drift
//   node scripts/sync-podcast.mjs --apply              write the corrections
//   node scripts/sync-podcast.mjs --apply --into "Вводные и финалы"
//                                                     also file new episodes
//
// A new episode has no topic yet, so it cannot be filed automatically. Without
// --into the run reports it and stops rather than guessing.

import { readFile, writeFile } from 'node:fs/promises';

const API = 'https://api.mave.digital/v1/website/ysnit/episodes';
const SITE = 'https://ysnit.mave.digital';
const PAGE_SIZE_GUESS = 20;

export function length(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function codeOf(url) {
  const match = /\/ep-(\d+)$/.exec(url);
  return match ? Number(match[1]) : null;
}

function factsOf(episode) {
  return {
    season: episode.season,
    episode: episode.code,
    date: episode.publish_date.slice(0, 10),
    url: `${SITE}/ep-${episode.code}`,
    length: length(episode.duration),
  };
}

// Key order is fixed so that a run which changes nothing writes a byte-identical
// file. A generated file that reshuffles itself produces a diff every time and
// trains you to stop reading them.
function entryOf(episode, title) {
  const facts = factsOf(episode);
  return {
    season: facts.season,
    episode: facts.episode,
    date: facts.date,
    title,
    url: facts.url,
    length: facts.length,
  };
}

/**
 * Merges API facts into the existing sections, keeping every topic and title.
 * Returns the new sections plus the drift it found, so a dry run can report it.
 */
export function merge(sections, episodes, { into = null } = {}) {
  const byCode = new Map(episodes.map((e) => [e.code, e]));
  const changes = [];
  const placed = new Set();

  const merged = sections.map((section) => ({
    name: section.name,
    episodes: section.episodes.flatMap((entry) => {
      const code = codeOf(entry.url);
      const api = byCode.get(code);
      if (api === undefined) {
        changes.push({ kind: 'gone', code, title: entry.title });
        return [];
      }
      placed.add(code);
      const facts = factsOf(api);
      for (const [field, value] of Object.entries(facts)) {
        if (entry[field] !== value) {
          changes.push({ kind: 'fixed', code, field, was: entry[field], now: value });
        }
      }
      return [entryOf(api, entry.title)];
    }),
  }));

  const fresh = episodes.filter((e) => !placed.has(e.code)).sort((a, b) => a.code - b.code);
  for (const episode of fresh) {
    changes.push({ kind: 'new', code: episode.code, title: episode.title });
  }

  if (fresh.length > 0 && into !== null) {
    const target = merged.find((s) => s.name.ru === into || s.name.en === into);
    if (target === undefined) {
      throw new Error(`no section named ${JSON.stringify(into)}`);
    }
    // The platform title lands verbatim and wants editing afterwards — it is
    // written to be spoken, not read.
    target.episodes.push(...fresh.map((e) => entryOf(e, e.title)));
  }

  for (const section of merged) {
    section.episodes.sort((a, b) => a.episode - b.episode);
  }

  return { sections: merged, changes, unfiled: into === null ? fresh : [] };
}

export async function fetchEpisodes(fetchImpl = fetch) {
  const headers = { Accept: 'application/json', Referer: `${SITE}/` };
  const seen = new Map();
  let total = Infinity;

  for (let page = 1; seen.size < total && page <= 50; page += 1) {
    const url = `${API}?view=all&sort=order&page=${page}&format=all`;
    const response = await fetchImpl(url, { headers });
    if (!response.ok) throw new Error(`${url} -> ${response.status}`);
    const body = await response.json();
    total = body.total ?? total;
    const batch = body.episodes ?? [];
    if (batch.length === 0) break;
    for (const episode of batch) seen.set(episode.id, episode);
    if (batch.length < PAGE_SIZE_GUESS && seen.size >= total) break;
  }

  if (seen.size !== total) {
    throw new Error(`fetched ${seen.size} episodes but the API reports ${total}`);
  }
  return [...seen.values()];
}

function describe(changes) {
  const of = (kind) => changes.filter((c) => c.kind === kind);
  for (const c of of('fixed')) {
    console.log(`  ep-${c.code}: ${c.field} ${JSON.stringify(c.was)} -> ${JSON.stringify(c.now)}`);
  }
  for (const c of of('gone')) console.log(`  ep-${c.code} is no longer published: ${c.title}`);
  for (const c of of('new')) console.log(`  ep-${c.code} is new: ${c.title}`);
  return { fixed: of('fixed').length, gone: of('gone').length, added: of('new').length };
}

if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const apply = process.argv.includes('--apply');
  const intoAt = process.argv.indexOf('--into');
  const into = intoAt === -1 ? null : process.argv[intoAt + 1] ?? null;

  const sections = JSON.parse(await readFile('podcast.json', 'utf8'));
  const episodes = await fetchEpisodes();
  const { sections: next, changes, unfiled } = merge(sections, episodes, { into });

  const counts = describe(changes);
  const listed = next.reduce((a, s) => a + s.episodes.length, 0);
  console.log(
    `\n${episodes.length} episodes published, ${listed} listed — ` +
      `${counts.fixed} field(s) corrected, ${counts.added} new, ${counts.gone} withdrawn`,
  );

  if (unfiled.length > 0) {
    console.error(
      `\n${unfiled.length} episode(s) have no topic yet. Re-run with --into "<section>" to file ` +
        `them, then edit their titles in podcast.json: the platform writes titles to be spoken.`,
    );
    console.error(`Sections: ${next.map((s) => s.name.ru).join(' | ')}`);
    process.exit(1);
  }

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to write podcast.json.');
  } else {
    await writeFile('podcast.json', `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    console.log('\npodcast.json written.');
  }
}
