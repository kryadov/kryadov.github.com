import test from 'node:test';
import assert from 'node:assert/strict';
import { merge, length, codeOf, fetchEpisodes } from '../scripts/sync-podcast.mjs';

const api = (code, over = {}) => ({
  id: `id-${code}`,
  code,
  season: 1,
  duration: 600,
  publish_date: '2024-06-06T10:00:00.000Z',
  title: `platform title ${code}`,
  ...over,
});

const sections = () => [
  {
    name: { en: 'Openers', ru: 'Вводные' },
    episodes: [
      {
        season: 1,
        episode: 1,
        date: '2024-06-06',
        title: 'A readable title',
        url: 'https://ysnit.mave.digital/ep-1',
        length: '10:00',
      },
    ],
  },
  { name: { en: 'Development', ru: 'Разработка' }, episodes: [] },
];

test('length pads minutes, so a trailer is never mistaken for an hour', () => {
  assert.equal(length(41), '00:41');
  assert.equal(length(600), '10:00');
  assert.equal(length(4037), '67:17');
});

test('codeOf reads the number out of the episode url', () => {
  assert.equal(codeOf('https://ysnit.mave.digital/ep-45'), 45);
  assert.equal(codeOf('https://example.org/'), null);
});

test('the readable title survives a merge, the facts are taken from the api', () => {
  const { sections: out } = merge(sections(), [api(1, { season: 3, duration: 41 })]);
  const episode = out[0].episodes[0];
  assert.equal(episode.title, 'A readable title', 'the editorial title was overwritten');
  assert.equal(episode.season, 3);
  assert.equal(episode.length, '00:41');
});

test('a wrong season, length or date is reported as a correction', () => {
  const { changes } = merge(sections(), [api(1, { season: 3, duration: 41 })]);
  const fields = changes.filter((c) => c.kind === 'fixed').map((c) => c.field).sort();
  assert.deepEqual(fields, ['length', 'season']);
});

test('a new episode is reported and left unfiled rather than guessed at', () => {
  const { sections: out, changes, unfiled } = merge(sections(), [api(1), api(2)]);
  assert.deepEqual(
    changes.filter((c) => c.kind === 'new').map((c) => c.code),
    [2],
  );
  assert.deepEqual(unfiled.map((e) => e.code), [2]);
  assert.equal(out.flatMap((s) => s.episodes).length, 1, 'the new episode was filed anyway');
});

test('--into files new episodes into the named section', () => {
  const { sections: out, unfiled } = merge(sections(), [api(1), api(2)], { into: 'Разработка' });
  assert.deepEqual(unfiled, []);
  assert.deepEqual(out[1].episodes.map((e) => e.episode), [2]);
});

test('--into rejects a section name that does not exist', () => {
  assert.throws(() => merge(sections(), [api(1), api(2)], { into: 'Нет такой' }), /no section named/);
});

test('an episode the platform withdrew is dropped and reported', () => {
  const { sections: out, changes } = merge(sections(), [api(2)], { into: 'Вводные' });
  assert.deepEqual(
    changes.filter((c) => c.kind === 'gone').map((c) => c.code),
    [1],
  );
  assert.ok(!out.flatMap((s) => s.episodes).some((e) => e.episode === 1));
});

test('episodes come out ordered within a section', () => {
  const { sections: out } = merge(sections(), [api(1), api(9), api(3)], { into: 'Вводные' });
  assert.deepEqual(out[0].episodes.map((e) => e.episode), [1, 3, 9]);
});

test('fetchEpisodes paginates until it has everything the api reports', async () => {
  const pages = {
    1: { total: 3, episodes: [api(1), api(2)] },
    2: { total: 3, episodes: [api(3)] },
  };
  const asked = [];
  const fake = async (url) => {
    const page = Number(new URL(url).searchParams.get('page'));
    asked.push(page);
    return { ok: true, json: async () => pages[page] ?? { total: 3, episodes: [] } };
  };
  const episodes = await fetchEpisodes(fake);
  assert.equal(episodes.length, 3);
  assert.deepEqual(asked, [1, 2]);
});

test('fetchEpisodes refuses a short read instead of writing a truncated index', async () => {
  const fake = async () => ({ ok: true, json: async () => ({ total: 45, episodes: [api(1)] }) });
  await assert.rejects(fetchEpisodes(fake), /fetched 1 episodes but the API reports 45/);
});
