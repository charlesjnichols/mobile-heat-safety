const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const assets = path.join(__dirname, '..', 'assets');
const SRC_ICON = path.join(assets, 'icon.png');
const DST_FAVICON = path.join(assets, 'favicon.png');
const SIZE = 48;

if (!fs.existsSync(SRC_ICON)) {
  console.error(`Source icon not found: ${SRC_ICON}`);
  process.exit(1);
}

let src;
try {
  src = PNG.sync.read(fs.readFileSync(SRC_ICON));
} catch (err) {
  console.error(`Failed to read/parse ${SRC_ICON}: ${err.message}`);
  process.exit(1);
}

if (!src || !src.width || !src.height) {
  console.error(`Failed to decode ${SRC_ICON}: no dimensions`);
  process.exit(1);
}

// Downscale a square source so non-square input is centered without distortion.
const side = Math.min(src.width, src.height);
const out = new PNG({ width: SIZE, height: SIZE });
for (let y = 0; y < SIZE; y++) {
  const sy = Math.floor((y + 0.5) * side / SIZE);
  for (let x = 0; x < SIZE; x++) {
    const sx = Math.floor((x + 0.5) * side / SIZE);
    const si = (src.width * sy + sx) << 2;
    const di = (SIZE * y + x) << 2;
    out.data[di] = src.data[si];
    out.data[di + 1] = src.data[si + 1];
    out.data[di + 2] = src.data[si + 2];
    out.data[di + 3] = src.data[si + 3];
  }
}

try {
  fs.writeFileSync(DST_FAVICON, PNG.sync.write(out));
} catch (err) {
  console.error(`Failed to write ${DST_FAVICON}: ${err.message}`);
  process.exit(1);
}
console.log(`Wrote favicon.png ${SIZE}x${SIZE}`);