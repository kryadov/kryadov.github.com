// Candidate correction for the plan's src/html.mjs.
//
// The defect: html() returned a plain string, and render() escapes strings, so
// every NESTED html`...` interpolation was escaped into visible source text.
// The fix: html() returns a marked object that renders as-is and stringifies
// naturally, so nesting composes and no raw() wrapper is needed at call sites.

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class Raw {
  constructor(value) {
    this.__raw = String(value);
  }

  toString() {
    return this.__raw;
  }
}

export function raw(value) {
  return new Raw(value);
}

function render(value) {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (value instanceof Raw) return value.__raw;
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    out += render(values[i]) + strings[i + 1];
  }
  return new Raw(out);
}
