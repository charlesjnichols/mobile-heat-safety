const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const assets = path.join(__dirname, '..', 'assets');

function convertJpgToPng(jpgFile, pngFile) {
  const src = path.join(assets, jpgFile);
  const dst = path.join(assets, pngFile);
  const raw = fs.readFileSync(src);
  const img = jpeg.decode(raw, { useTArray: true });
  const png = new PNG({ width: img.width, height: img.height });
  png.data = Buffer.from(img.data);
  const buf = PNG.sync.write(png);
  fs.writeFileSync(dst, buf);
  console.log(`Wrote ${pngFile} (${img.width}x${img.height})`);
}

convertJpgToPng('adaptive-icon.jpg', 'adaptive-icon.png');
convertJpgToPng('splash.jpg', 'splash.png');