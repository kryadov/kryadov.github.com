import { readFile } from 'node:fs/promises';

export const TRACKS = ['ai', 'jvm', 'interactive', 'teaching', 'medicine'];
export const LOCALES = ['en', 'ru'];

const TEXT_FIELDS = ['title', 'summary'];

function checkLocalisedText(work, field, errors, at, { required }) {
  const value = work[field];
  if (value === null || value === undefined) {
    if (required) errors.push(`${at}: ${field} is required`);
    return;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${at}: ${field} must be an object with en and ru keys`);
    return;
  }
  for (const locale of LOCALES) {
    const text = value[locale];
    if (typeof text !== 'string' || text.trim() === '') {
      errors.push(`${at}: ${field}.${locale} must be a non-empty string`);
    }
  }
}

export function validateWork(work, index) {
  const errors = [];
  const label = work && typeof work.id === 'string' ? ` (${work.id})` : '';
  const at = `works[${index}]${label}`;

  if (typeof work !== 'object' || work === null || Array.isArray(work)) {
    return [`${at}: entry must be an object`];
  }
  if (typeof work.id !== 'string' || work.id.trim() === '') {
    errors.push(`${at}: id must be a non-empty string`);
  }
  if (!TRACKS.includes(work.track)) {
    errors.push(`${at}: track must be one of ${TRACKS.join(', ')}`);
  }
  if (typeof work.private !== 'boolean') {
    errors.push(`${at}: private must be a boolean`);
  }
  if (typeof work.hero !== 'boolean') {
    errors.push(`${at}: hero must be a boolean`);
  }
  if (!Number.isInteger(work.year)) {
    errors.push(`${at}: year must be an integer`);
  }
  if (!Array.isArray(work.stack) || work.stack.some((s) => typeof s !== 'string')) {
    errors.push(`${at}: stack must be an array of strings`);
  }
  if (work.repo !== null && typeof work.repo !== 'string') {
    errors.push(`${at}: repo must be a string or null`);
  }
  if (work.private === true && work.repo !== null) {
    errors.push(`${at}: repo must be null on a private entry`);
  }
  if (work.live !== null && typeof work.live !== 'string') {
    errors.push(`${at}: live must be a string or null`);
  }
  if (work.cover !== null && typeof work.cover !== 'string') {
    errors.push(`${at}: cover must be a string or null`);
  }
  for (const field of TEXT_FIELDS) {
    checkLocalisedText(work, field, errors, at, { required: true });
  }
  checkLocalisedText(work, 'detail', errors, at, { required: work.private === true });

  return errors;
}

export function validateWorks(works) {
  if (!Array.isArray(works)) return ['works.json must contain an array'];
  const errors = [];
  const seen = new Set();
  works.forEach((work, index) => {
    errors.push(...validateWork(work, index));
    const id = work && work.id;
    if (typeof id === 'string') {
      if (seen.has(id)) errors.push(`works[${index}]: duplicate id ${id}`);
      seen.add(id);
    }
  });
  return errors;
}

export async function loadWorks(path = 'works.json') {
  const works = JSON.parse(await readFile(path, 'utf8'));
  const errors = validateWorks(works);
  if (errors.length > 0) {
    throw new Error(`${path} is invalid:\n  ${errors.join('\n  ')}`);
  }
  return works;
}
