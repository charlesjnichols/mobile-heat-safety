const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const assets = path.join(__dirname, '..', 'assets');
const publicDir = path.join(__dirname, '..', 'public');

const srcPath = path.join(assets, 'icon.png');
const srcPng = PNG.sync.read(fs.readFileSync(srcPath));

function resize(src, destSize) {
  const dst = new PNG({ width: destSize, height: destSize });
  const ratio = src.width / destSize;
  for (let y = 0; y < destSize; y++) {
    for (let x = 0; x < destSize; x++) {
      const sx = Math.min(src.width - 1, Math.floor((x + 0.5) * ratio));
      const sy = Math.min(src.height - 1, Math.floor((y + 0.5) * ratio));
      const srcIdx = (sy * src.width + sx) * 4;
      const dstIdx = (y * destSize + x) * 4;
      dst.data[dstIdx] = srcPng.data[srcIdx];
      dst.data[dstIdx + 1] = srcPng.data[srcIdx + 1];
      dst.data[dstIdx + 2] = srcPng.data[srcIdx + 2];
      dst.data[dstIdx + 3] = srcPng.data[srcIdx + 3];
    }
  }
  return dst;
}

function toMaskable(src, destSize, padRatio) {
  const dst = resize(src, destSize);
  const pad = Math.round(destSize * padRatio);
  const inner = destSize - pad * 2;
  const scaled = resize(src, inner);
  const dst2 = new PNG({ width: destSize, height: destSize });
  for (let y = 0; y < destSize; y++) {
    for (let x = 0; x < destSize; x++) {
      const dstIdx = (y * destSize + x) * 4;
      if (x < pad || y < pad || x >= destSize - pad || y >= destSize - pad) {
        dst2.data[dstIdx] = 255;
        dst2.data[dstIdx + 1] = 255;
        dst2.data[dstIdx + 2] = 255;
        dst2.data[dstIdx + 3] = 255;
      } else {
        const sx = x - pad;
        const sy = y - pad;
        const srcIdx = (sy * scaled.width + sx) * 4;
        dst2.data[dstIdx] = scaled.data[srcIdx];
        dst2.data[dstIdx + 1] = scaled.data[srcIdx + 1];
        dst2.data[dstIdx + 2] = scaled.data[srcIdx + 2];
        dst2.data[dstIdx + 3] = scaled.data[srcIdx + 3];
      }
    }
  }
  void dst;
  return dst2;
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const targets = [
  { file: 'icon-192.png', gen: (s) => resize(s, 192) },
  { file: 'icon-512.png', gen: (s) => resize(s, 512) },
  { file: 'icon-maskable-512.png', gen: (s) => toMaskable(s, 512, 0.2) },
];

for (const t of targets) {
  const out = t.gen(srcPng);
  fs.writeFileSync(path.join(publicDir, t.file), PNG.sync.write(out));
  console.log(`Wrote public/${t.file}`);
}
