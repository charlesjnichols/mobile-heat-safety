const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const assets = path.join(__dirname, '..', 'assets');
const src = PNG.sync.read(fs.readFileSync(path.join(assets, 'icon.png')));

const size = 48;
const out = new PNG({ width: size, height: size });
for (let y = 0; y < size; y++) {
  const sy = Math.min(src.height - 1, Math.floor((y + 0.5) * src.height / size));
  for (let x = 0; x < size; x++) {
    const sx = Math.min(src.width - 1, Math.floor((x + 0.5) * src.width / size));
    const si = (src.width * sy + sx) << 2;
    const di = (size * y + x) << 2;
    out.data[di] = src.data[si];
    out.data[di + 1] = src.data[si + 1];
    out.data[di + 2] = src.data[si + 2];
    out.data[di + 3] = src.data[si + 3];
  }
}
fs.writeFileSync(path.join(assets, 'favicon.png'), PNG.sync.write(out));
console.log('Wrote favicon.png 48x48');