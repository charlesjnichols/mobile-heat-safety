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

All data is stored locally on your device by default. The app has no account system and does not transmit data unless you opt into the optional cloud sync backend. See [PRIVACY_POLICY.md](apps/mobile/PRIVACY_POLICY.md) for details.

## Tech Stack

- **Client:** React Native / Expo, TypeScript, AsyncStorage for local persistence, Zod for validation
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

## Development

- `.specify/` — specification-driven feature specs
- `specs/` — feature specification documents

## PWA & Web Deployment

`npm run build:web --workspace @coaching-code/mobile` produces a PWA-ready `dist/` with a web app manifest (`manifest.json`), a service worker (`sw.js`), home-screen icons, and the app shell. The service worker enables offline launch and updates; all data remains local (there is no backend and no telemetry).

Serve `dist/` over HTTPS (service workers require a secure context) with these recommended response headers:

- `index.html` (and `sw.js`): `Cache-Control: no-cache` so clients fetch the newest version and pick up the updated service worker.
- Hashed static assets under `/_expo/static/`, `/assets/`, icons, and `manifest.json`: `Cache-Control: public, max-age=31536000, immutable`.

Recommended `Content-Security-Policy` to preserve the local-only privacy model (no third-party origins, scripts, or trackers):

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'
```

## License

This project is not yet licensed.
