import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadWorks, LOCALES } from './src/data.mjs';
import { outputPath } from './src/render/layout.mjs';
import { renderHome } from './src/render/home.mjs';
import { renderLab } from './src/render/lab.mjs';
import { renderPodcast } from './src/render/podcast.mjs';

// Copied verbatim so external links keep resolving. Never add docs, specs or
// plans here: this repository is public and its output is published.
export const PASSTHROUGH = ['client', 'ysnit', 'log4j-logback.png'];

async function writePage(outDir, relative, contents) {
  const target = join(outDir, relative);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents, 'utf8');
  return relative;
}

export async function build(outDir = 'dist') {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const works = await loadWorks();
  const labItems = JSON.parse(await readFile('lab.json', 'utf8'));
  const podcastSections = JSON.parse(await readFile('podcast.json', 'utf8'));

  const written = [];
  for (const locale of LOCALES) {
    written.push(
      await writePage(outDir, outputPath(locale, 'home'), renderHome(works, locale)),
      await writePage(outDir, outputPath(locale, 'lab'), renderLab(labItems, locale)),
      await writePage(
        outDir,
        outputPath(locale, 'podcast'),
        renderPodcast(podcastSections, locale),
      ),
    );
  }

  await cp('assets', join(outDir, 'assets'), { recursive: true });
  for (const entry of PASSTHROUGH) {
    await cp(entry, join(outDir, entry), { recursive: true });
  }

  return written;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const written = await build();
  console.log(`built ${written.length} pages into dist/`);
}
