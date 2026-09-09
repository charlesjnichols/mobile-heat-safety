# Mobile Heat Safety Tracker

A cross-platform mobile application for coaches and athletic staff to record heat safety checklists during sports practices.

## Features

- **Teams & practices** — create teams and record practice location, date, and head coach.
- **Checklists** — log observation time, air temperature, relative humidity, and the action taken (e.g., water break frequency, practice modification).
- **Heat index** — automatically calculates the National Weather Service heat index and color-codes entries by threshold.
- **Export** — generate and share CSV or PDF exports of your checklists.

## Privacy

All data is stored locally on your device. The app has no account system, no backend, and does not transmit, upload, or share your information with any third party. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for details.

## Tech Stack

- [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/)
- TypeScript
- AsyncStorage for local persistence
- Zod for validation

## Getting Started

```bash
npm install
npm start
```

Run on a specific platform:

```bash
npm run android
npm run ios
npm run web
```

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm start`            | Start the Expo dev server            |
| `npm run android`      | Run on Android                       |
| `npm run ios`          | Run on iOS                           |
| `npm run web`          | Run on web                           |
| `npm test`             | Run unit/component tests             |
| `npm run lint`         | Lint TypeScript files                |
| `npm run typecheck`    | Check types with `tsc`               |
| `npm run validate`     | Lint, typecheck, and test            |
| `npm run build:android`| Build an Android release             |
| `npm run build:web`    | Export a web build                   |

## Development

- `.specify/` — specification-driven feature specs
- `specs/` — feature specification documents
- `docs/windows-development.md` — Windows development notes

## PWA & Web Deployment

`npm run build:web` produces a PWA-ready `dist/` with a web app manifest
(`manifest.json`), a service worker (`sw.js`), home-screen icons, and the app
shell. The service worker enables offline launch and updates; all data remains
local (there is no backend and no telemetry).

Serve `dist/` over HTTPS (service workers require a secure context) with these
recommended response headers:

- `index.html` (and `sw.js`): `Cache-Control: no-cache` so clients fetch the
  newest version and pick up the updated service worker.
- Hashed static assets under `/_expo/static/`, `/assets/`, icons, and
  `manifest.json`: `Cache-Control: public, max-age=31536000, immutable`.

Recommended `Content-Security-Policy` to preserve the local-only privacy model
(no third-party origins, scripts, or trackers):

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'
```

## License

This project is not yet licensed.