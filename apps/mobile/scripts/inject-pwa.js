const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

// Items are injected only if not already present, so the script is idempotent.
// theme-color and description are emitted by Expo itself from `app.json` web
// config, so we do not duplicate them here.
const headTags = [
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="HeatSafety" />',
  '<link rel="manifest" href="./manifest.json" />',
  '<link rel="icon" type="image/svg+xml" href="./favicon.svg" />',
  '<link rel="apple-touch-icon" href="./icon-192.png" />',
];

if (!fs.existsSync(indexPath)) {
  console.error(`index.html not found at ${indexPath}. Run 'npm run build:web' first.`);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

const missing = headTags.filter((tag) => !html.includes(tag));
if (missing.length === 0) {
  console.log('PWA meta already present; skipping injection.');
  process.exit(0);
}

const headClose = html.indexOf('</head>');
if (headClose === -1) {
  console.error('No </head> found in index.html.');
  process.exit(1);
}

const block = '\n' + missing.map((tag) => `    ${tag}`).join('\n') + '\n';
html = html.slice(0, headClose) + block + html.slice(headClose);

fs.writeFileSync(indexPath, html);
console.log(`Injected PWA tags into dist/index.html (${missing.length} added)`);
