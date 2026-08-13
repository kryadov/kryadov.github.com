export const TRACK_HUE = {
  ai: 265,
  jvm: 12,
  interactive: 190,
  teaching: 45,
  medicine: 150,
};

export function hash32(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let state = seed | 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function coverSvg(id, track, { width = 640, height = 360 } = {}) {
  const baseHue = TRACK_HUE[track];
  if (baseHue === undefined) throw new Error(`unknown track: ${track}`);

  const rand = mulberry32(hash32(`${id}:${track}`));
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.4;
  const turns = 2.5 + rand() * 2.5;
  const phase = rand() * Math.PI * 2;
  const dots = 90;
  const parts = [];

  for (let i = 0; i < dots; i += 1) {
    const t = i / (dots - 1);
    const angle = phase + t * turns * Math.PI * 2;
    const r = maxR * Math.pow(t, 0.65);
    const x = cx + Math.cos(angle) * r * 1.45;
    const y = cy + Math.sin(angle) * r;
    const dotR = 2 + (1 - t) * 9 * (0.5 + rand() * 0.7);
    const hue = baseHue + (rand() * 40 - 20);
    const light = 45 + t * 25;
    const alpha = 0.25 + (1 - t) * 0.6;
    parts.push(
      `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${dotR.toFixed(2)}"` +
        ` fill="hsl(${hue.toFixed(1)} 72% ${light.toFixed(1)}%)"` +
        ` fill-opacity="${alpha.toFixed(3)}"/>`,
    );
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"` +
    ` width="${width}" height="${height}" role="img" aria-hidden="true"` +
    ` preserveAspectRatio="xMidYMid slice">` +
    `<rect width="${width}" height="${height}" fill="hsl(${baseHue} 32% 11%)"/>` +
    parts.join('') +
    `</svg>`
  );
}
