const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const assets = path.join(__dirname, '..', 'assets');

const FAVICON_SOURCES = {
  'adaptive-icon.jpg': 'adaptive-icon.png',
  'splash.jpg': 'splash.png',
};

function convertJpgToPng(jpgFile, pngFile) {
  const src = path.join(assets, jpgFile);
  const dst = path.join(assets, pngFile);

  if (!fs.existsSync(src)) {
    console.error(`Source file not found: ${src}`);
    process.exit(1);
  }

  let img;
  try {
    const raw = fs.readFileSync(src);
    img = jpeg.decode(raw, { useTArray: true });
  } catch (err) {
    console.error(`Failed to decode ${src}: ${err.message}`);
    process.exit(1);
  }

  if (!img || !img.width || !img.height) {
    console.error(`Failed to decode ${src}: no dimensions`);
    process.exit(1);
  }

  const png = new PNG({ width: img.width, height: img.height });
  png.data = Buffer.from(img.data);
  try {
    const buf = PNG.sync.write(png);
    fs.writeFileSync(dst, buf);
  } catch (err) {
    console.error(`Failed to write ${dst}: ${err.message}`);
    process.exit(1);
  }
  console.log(`Wrote ${pngFile} (${img.width}x${img.height})`);
}

for (const [src, dst] of Object.entries(FAVICON_SOURCES)) {
  convertJpgToPng(src, dst);
}