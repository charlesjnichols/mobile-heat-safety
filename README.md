# Mobile Heat Safety Tracker

A cross-platform application for coaches and athletic staff to record heat safety checklists during sports practices, backed by an AWS serverless sync and multi-tenant management layer.

## Repository Layout

This is an npm-workspaces monorepo.

```
apps/mobile/            Expo React Native app (iOS, Android, web/PWA)
packages/domain/        Shared zod schemas & domain types (client + server)
services/api/           AWS Lambda handlers (sync & management API)
infrastructure/cdk/     AWS CDK stack (Cognito, API Gateway, Lambda, DynamoDB)
```

- **apps/mobile** — the client. Runs on iOS, Android, and web (react-native-web + PWA).
- **packages/domain** — the single source of truth for validation schemas and domain types, consumed by both the app and the lambdas so they cannot drift.
- **services/api** — Lambda handlers behind API Gateway.
- **infrastructure/cdk** — infrastructure-as-code for the serverless stack.

## Features

- **Teams & practices** — create teams and record practice location, date, and head coach.
- **Checklists** — log observation time, air temperature, relative humidity, and the action taken (e.g., water break frequency, practice modification).
- **Heat index** — automatically calculates the National Weather Service heat index and color-codes entries by threshold.
- **Export** — generate and share CSV or PDF exports of your checklists.

## Privacy

All data is stored locally on your device by default (IndexedDB via Dexie). The app has no required account system and does not transmit data unless you opt into the optional cloud sync backend. See [PRIVACY_POLICY.md](apps/mobile/PRIVACY_POLICY.md) for details.

## Tech Stack

- **Client:** React Native / Expo, TypeScript, Dexie.js (IndexedDB) for local persistence, Zod for validation
- **Offline sync:** background sync queue that pushes local changes to the backend when connectivity returns
- **Auth:** Cognito (amazon-cognito-identity-js) with cached JWTs for offline session restoration
- **Server:** AWS serverless — Cognito, API Gateway, Lambda, DynamoDB (provisioned via AWS CDK)
- **Shared:** `@coaching-code/domain` (zod schemas + types)

## Getting Started

```bash
npm install
npm start --workspace @coaching-code/mobile
```

Run on a specific platform:

```bash
npm run android --workspace @coaching-code/mobile
npm run ios --workspace @coaching-code/mobile
npm run web --workspace @coaching-code/mobile
```

## Workspace Scripts

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `npm test`            | Run all workspace tests              |
| `npm run lint`        | Lint all workspaces                  |
| `npm run typecheck`   | Typecheck all workspaces             |
| `npm run validate`    | Lint + typecheck + test across workspaces |

Mobile-specific scripts (run with `--workspace @coaching-code/mobile`):

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm start`            | Start the Expo dev server            |
| `npm run android`      | Run on Android                       |
| `npm run ios`          | Run on iOS                           |
| `npm run web`          | Run on web                           |
| `npm test`             | Run unit/component tests             |
| `npm run build:web`    | Export a web build                   |

## Serverless Backend

The AWS stack (Cognito user pool, API Gateway REST API, Lambda sync handler, DynamoDB table) is defined in `infrastructure/cdk` and deployed with AWS CDK:

```bash
npm run deploy --workspace @coaching-code/infrastructure
```

The API exposes a `GET/PUT /sync` endpoint (Cognito-authorizer protected) that the client uses for remote synchronization and multi-tenant data management.

## Offline Data Layer, Sync & Auth

The app is offline-first: all field data (teams, practices, checklists) is persisted locally in IndexedDB via Dexie (`apps/mobile/src/db/`), which is the authoritative source of truth. A background sync engine (`apps/mobile/src/sync/`) queues local mutations and pushes them to the `/sync` backend automatically when connectivity returns, exactly-once and in creation order.

Authentication (`apps/mobile/src/auth/`) uses Cognito with secure session caching: JWTs are stored in `localStorage`, so a previously signed-in coach opens the app offline without a sign-in prompt. If the cached session is expired, the app refreshes it only when online; offline, the app remains fully usable with local data.

Configure the client with build-time env vars:

```
EXPO_PUBLIC_COGNITO_USER_POOL_ID
EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID
EXPO_PUBLIC_COGNITO_REGION
EXPO_PUBLIC_API_URL
```

When Cognito is not configured, the app runs fully offline without auth or sync.

## Development

- `.specify/` — specification-driven feature specs
- `specs/` — feature specification documents

## PWA & Web Deployment

`npm run build:web --workspace @coaching-code/mobile` produces a PWA-ready `dist/` with a web app manifest (`manifest.json`), a service worker (`sw.js`), home-screen icons, and the app shell. The service worker enables offline launch and updates; all data remains local (there is no backend and no telemetry).

Serve `dist/` over HTTPS (service workers require a secure context) with these recommended response headers:

- `index.html` (and `sw.js`): `Cache-Control: no-cache` so clients fetch the newest version and pick up the updated service worker.
- Hashed static assets under `/_expo/static/`, `/assets/`, icons, and `manifest.json`: `Cache-Control: public, max-age=31536000, immutable`.

Recommended `Content-Security-Policy` to preserve the local-only privacy model (no third-party origins, scripts, or trackers beyond the identity provider used for sign-in):

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://<cognito-domain>; manifest-src 'self'; worker-src 'self'
```

Replace `https://<cognito-domain>` with the hosted-UI domain (e.g. `https://mobile-heat-safety.auth.us-east-1.amazoncognito.com`) so the OAuth token exchange can reach it. Sign-in and sign-out are top-level redirects to that domain, which are not restricted by `connect-src`.

Identity configuration is injected at build time via GitHub Actions repository variables (see the deploy workflow):

```
EXPO_PUBLIC_COGNITO_USER_POOL_ID
EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID
EXPO_PUBLIC_COGNITO_REGION
EXPO_PUBLIC_COGNITO_DOMAIN
EXPO_PUBLIC_REDIRECT_URI
EXPO_PUBLIC_LOGOUT_URI
EXPO_PUBLIC_API_URL
```

## License

This project is not yet licensed.
