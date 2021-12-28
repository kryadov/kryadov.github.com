function setup() {
  const size = min(window.innerWidth, window.innerHeight);
  createCanvas(size, size);
  colorMode(HSL, 1);
}

function invCosn(v) {
  return 1 - (cos(v * TWO_PI) * 0.5 + 0.5);
}

let t;
let frame = 0;

let n;
function draw() {
  frame += deltaTime / (1000 / 30);
  t = fract(frame / frames);

  scale(width, height);
  background(0);
  stroke(1);
  strokeWeight(0.003);
  n = f + floor(1 * t);
  let depth = (maxDepth) * invCosn(t * f);
  drawFractal(0.5, 0.5, 1 / 2.5, depth);
}

function polar(angle, radius) {
  return {
    x: cos(angle * TWO_PI) * radius,
    y: sin(angle * TWO_PI) * radius,
  }
}

function drawFractal(x, y, size, depth) {
  const df = constrain(depth, 0, 1);
  for (let i = 0; i < n; i++) {
    const f = i / n;
    const angle = f + 0.25;

    if (depth > 0) {
      const scale = 0.5;
      const r = size * (df * scale);
      const p = polar(angle, r);
      const s = size * (1 - df * scale);
      drawFractal(x + p.x, y + p.y, s, depth - 1);
    } else {
      const p1 = polar(angle, size);
      const p2 = polar(angle + 1 / n, size);

      const hue = fract(t + y * 0.25);
      const sat = 0.75;
      const light = x * 0.2 + 0.5;
      const c = color(hue, sat, light);
      stroke(c);

      line(x + p1.x, y + p1.y, x + p2.x, y + p2.y);
    }
  }
}