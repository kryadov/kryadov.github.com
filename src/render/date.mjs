// One place, because the printed date appears on the list, on the post and in
// the feed, and three copies of a format are three chances to disagree.
//
// timeZone: 'UTC' on both ends. The date has no time in it; without pinning the
// zone, a build machine west of Greenwich would print the day before.
const formats = new Map();

function formatter(locale) {
  if (!formats.has(locale)) {
    // Map input locale to ICU locale code for consistent output regardless of
    // system locale defaults. 'en' means day-first format (British English).
    const icuLocale = locale === 'en' ? 'en-GB' : locale;
    formats.set(
      locale,
      new Intl.DateTimeFormat(icuLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    );
  }
  return formats.get(locale);
}

export function formatDate(locale, iso) {
  const printed = formatter(locale).format(new Date(`${iso}T00:00:00Z`));
  // Russian long dates come out of Intl as «16 августа 2026 г.». The «г.» is
  // correct in a document and noise on a blog index.
  return printed.replace(/\s*г\.$/, '');
}
