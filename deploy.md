# AWS Deployment Guide

This guide deploys the Heat Safety Tracker serverless backend using AWS CDK.

## Services Used

| Service | Purpose |
| --- | --- |
| AWS Cognito | User authentication via hosted UI (OAuth2 authorization-code + PKCE, social IdPs + hosted sign-in page) |
| AWS Secrets Manager | Stores the Google OAuth client secret; resolved at CDK deploy time, never rendered into the template |
| AWS API Gateway (REST) | HTTPS API front door with Cognito authorizer and CORS |
| AWS Lambda | Serverless handlers for the `/sync` endpoints (Node.js 20) |
| AWS DynamoDB | On-demand NoSQL table for checklist/team data (`pk` partition key) |
| AWS CDK / CloudFormation | Infrastructure-as-code; CDK synthesizes and deploys via CloudFormation |

## Prerequisites

1. Node.js 20+ and npm (monorepo: `npm install` at the repo root).
2. AWS CLI configured with credentials: `aws configure` or environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).
3. A CDK bootstrap in the target account/region (first deploy only):

   ```bash
   npx --workspace @coaching-code/infrastructure cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
   ```

## Configure AWS CLI

```bash
aws configure
# AWS Access Key ID: <your key>
# AWS Secret Access Key: <your secret>
# Default region name: <e.g. us-east-1>
# Default output format: json
```

Or use SSO / role profiles and export `AWS_PROFILE=<profile>`.

## Deploy

```bash
npm install

# Build all workspaces (shared domain package + api + infrastructure)
npm run build --workspaces --if-present

# Synthesize the CloudFormation template (optional sanity check)
npm run synth --workspace @coaching-code/infrastructure

# Load IdP credentials from .env (if used) — plain `source` does NOT export
# variables to child processes, so npm/cdk would run without them:
set -a; source .env; set +a

# Deploy the stack
npm run deploy --workspace @coaching-code/infrastructure

# First-time deploy requires acknowledging IAM capability for Lambda role:
npm run deploy --workspace @coaching-code/infrastructure -- --require-approval never
# or answer "y" at the role-creation prompt
```

Optional context flags:

```bash
npm run deploy --workspace @coaching-code/infrastructure -- \
  --region us-east-1 \
  --profile <aws-profile>
```

The stack is defined in `infrastructure/cdk/lib/heat-safety-backend-stack.ts` with the app entrypoint in `infrastructure/cdk/bin/infrastructure.ts`.

## Service-specific Details

### AWS Cognito

- Creates a User Pool with self sign-up enabled and email-code verification.
- Creates a User Pool Client configured for the Cognito Hosted UI (OAuth2 authorization-code + PKCE, scopes `openid profile email`). The web app signs in through the hosted page with Google, Facebook, Amazon, or Apple social providers (or native email/password via the hosted page) — it does not collect credentials itself.
- Only the hosted-UI OAuth flows are enabled on the client (`authorizationCodeGrant`); the legacy `ADMIN_USER_PASSWORD_AUTH`/`USER_SRP_AUTH` API flows are disabled.
- Social providers are only registered when their credentials are present in the environment at deploy time:

  ```bash
  # Each provider is optional; omit its credentials to skip it entirely.
  # Google's client secret is read from AWS Secrets Manager at deploy time
  # (never inlined into the synthesized template).
  export GOOGLE_CLIENT_ID=...        export GOOGLE_CLIENT_SECRET_SECRETS_MANAGER_SECRET=...
  #                                     ^ name of the Secrets Manager secret
  #                                     (default: heat-safety/google-client-secret, JSON field "secret");
  #                                     set only if not using the default name.

  export FACEBOOK_APP_ID=...         export FACEBOOK_APP_SECRET=...
  export AMAZON_CLIENT_ID=...        export AMAZON_CLIENT_SECRET=...
  export APPLE_CLIENT_ID=... APPLE_TEAM_ID=... APPLE_KEY_ID=... APPLE_PRIVATE_KEY=...   # all four required together
  ```

- The hosted-UI domain prefix and callback/logout URLs are also environment inputs:

  ```bash
  export COGNITO_DOMAIN_PREFIX=mobile-heat-safety          # → https://<prefix>.auth.<region>.amazoncognito.com
  export REDIRECT_URI=https://charlesjnichols.github.io/mobile-coach-heat-safety/
  export LOGOUT_URI=https://charlesjnichols.github.io/mobile-coach-heat-safety/
  ```

  `REDIRECT_URI`/`LOGOUT_URI` must match the live GitHub Pages URL exactly (Cognito rejects mismatches).
- After deploy, retrieve the client config from stack outputs:

  ```bash
  aws cloudformation describe-stacks \
    --stack-name HeatSafetyBackend \
    --query 'Stacks[0].Outputs' --output table
  ```

  Outputs: `UserPoolId`, `UserPoolClientId`, `ApiUrl`, `CognitoDomain`, `RedirectUri`, `LogoutUri`. `CognitoDomain`/`RedirectUri`/`LogoutUri` are the `EXPO_PUBLIC_*` values the web app needs (see "Deploying the Web Client" below).

- Confirm which social providers actually registered after deploy:

  ```bash
  aws cognito-idp list-identity-providers \
    --user-pool-id <UserPoolId> --region <region> \
    --query 'Providers[].ProviderName'

  aws cognito-idp describe-user-pool-client \
    --user-pool-id <UserPoolId> --client-id <UserPoolClientId> --region <region> \
    --query 'UserPoolClient.SupportedIdentityProviders'
  ```

  A provider silently absent from `list-identity-providers` means its env vars were missing at deploy time — see "Deploy ordering pitfall" below.

- **Deploy ordering pitfall**: the app client names its social providers (`SupportedIdentityProviders`), and Cognito rejects a client update that references a provider which doesn't exist yet. If CFN provisions the client before the provider, the whole update fails and rolls back ("The provider Google does not exist for User Pool …"). The stack already guards against this with `userPoolClient.node.addDependency(provider)` per social provider; keep that dependency if editing the stack. If you see this error on an older stack revision, redeploy — the retry creates the provider first.

### AWS API Gateway (REST)

- Creates REST API `heat-safety-api` with `GET /sync` and `PUT /sync`.
- Routes are protected by a Cognito User Pools authorizer; requests must carry a valid Cognito JWT (`Authorization` header) issued by the hosted UI sign-in.
- CORS is enabled for all origins/methods with `Content-Type` and `Authorization` headers (CLI/SDK deploys only need the AWS credentials; no extra permissions).

### AWS Lambda

- Deploys the `syncHandler` from `services/api/src/index.ts`, bundled with esbuild (`@aws-cdk/aws-lambda-nodejs`) with `@coaching-code/domain` inlined.
- Runtime: `nodejs20.x`. Environment variable `TABLE_NAME` is injected automatically — no manual Lambda configuration needed.
- Read/write IAM permissions on the table are granted by CDK (`table.grantReadWriteData`).

### AWS DynamoDB

- Creates table `HeatSafetyTable` with string partition key `pk`, `PAY_PER_REQUEST` (on-demand) billing.
- `removalPolicy: DESTROY` — deleting the stack deletes the table and its data. Change to `cdk.RemovalPolicy.RETAIN` before any production deploy.
- No capacity alarms configured; add CloudWatch alarms on `ThrottledRequests`/`ConsumedReadCapacityUnits` for production.

### AWS CloudFormation (via CDK)

CDK synthesizes the `HeatSafetyBackendStack` into a CloudFormation change set:

```bash
# Inspect changes before applying
npm run cdk --workspace @coaching-code/infrastructure -- diff

# List stack(s)
npm run cdk --workspace @coaching-code/infrastructure -- ls

# Roll back a failed deployment
aws cloudformation cancel-update-stack --stack-name HeatSafetyBackend
```

## Verify the Deployment

```bash
# Check stack outputs
aws cloudformation describe-stacks --stack-name HeatSafetyBackend \
  --query 'Stacks[0].Outputs' --output table

# Check the API is reachable (401 expected without a token)
curl -i "$(aws cloudformation describe-stacks --stack-name HeatSafetyBackend \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)sync"

# Confirm the DynamoDB table exists
aws dynamodb describe-table --table-name HeatSafetyTable
```

## Teardown

```bash
npm run cdk --workspace @coaching-code/infrastructure -- destroy
```

Note: the DynamoDB table is destroyed with the stack (see removal policy above).

## Deploying the Web Client

The Expo app (`apps/mobile`) is a web-only PWA deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main` (or manually via *Run workflow*). The workflow injects `EXPO_PUBLIC_*` build-time variables from **GitHub repository variables** into the web export.

### Where each value comes from

| GitHub repository variable | Source |
| --- | --- |
| `EXPO_PUBLIC_COGNITO_USER_POOL_ID` | CDK output `UserPoolId` (AWS) — `aws cloudformation describe-stacks --stack-name HeatSafetyBackend --query 'Stacks[0].Outputs[?OutputKey==\`UserPoolId\`].OutputValue' --output text` |
| `EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID` | CDK output `UserPoolClientId` (AWS) — same command with `UserPoolClientId` |
| `EXPO_PUBLIC_COGNITO_REGION` | The region you deployed CDK to (e.g. `us-east-1`; visible in the AWS console or `aws configure get region`) |
| `EXPO_PUBLIC_COGNITO_DOMAIN` | CDK output `CognitoDomain` — the **full URL** (`https://<prefix>.auth.<region>.amazoncognito.com`), not just the prefix. A bare prefix like `mobile-heat-safety` makes the app resolve `/<prefix>/oauth2/authorize` against its own origin and the sign-in link 404s on GitHub Pages. Same `describe-stacks` command with `OutputKey==\`CognitoDomain\``. Without the CLI, find it in the AWS Console: **Cognito → User pools → &lt;your pool&gt; → App integrations → Domain**, or via `aws cognito describe-user-pool --user-pool-id &lt;UserPoolId&gt; --query 'UserPool.Domain'`. |
| `EXPO_PUBLIC_REDIRECT_URI` | CDK output `RedirectUri` (echoes back what was passed as `REDIRECT_URI` at deploy time). Independent of AWS, it is also derivable from GitHub: `https://<owner>.github.io/<repo>/` — visible in the repo's **Settings → Pages** ("Visit site") or from the workflow's deployment step output. It must match the Pages URL exactly. |
| `EXPO_PUBLIC_LOGOUT_URI` | CDK output `LogoutUri` (normally the same URL as the redirect URI) |
| `EXPO_PUBLIC_API_URL` | CDK output `ApiUrl` — the API Gateway invoke URL (e.g. `https://xxxx.execute-api.us-east-1.amazonaws.com/prod`) |

Quick copy-paste to fetch all AWS-side values at once:

```bash
aws cloudformation describe-stacks --stack-name HeatSafetyBackend \
  --query 'Stacks[0].Outputs' --output table
```

No AWS CLI handy? Every value except the region is also visible in the AWS Console:

- **Cognito values** (`UserPoolId`, `UserPoolClientId`, `CognitoDomain`): **Cognito → User pools → <your pool>** (pool id on the overview tab; app client id and hosted-UI domain under **App integrations**).
- **`ApiUrl`**: **API Gateway → APIs → heat-safety-api** (invoke URL on the dashboard).
- **`RedirectUri`/`LogoutUri`**: whichever URLs were passed as `REDIRECT_URI`/`LOGOUT_URI` at deploy time (also shown under **App integrations → App client → Edit → Allowed callback/logout URLs**).

Set them under **GitHub → Settings → Secrets and variables → Actions → Variables** (not Secrets — these are public, non-sensitive config values). The next `deploy.yml` run bakes them into the PWA bundle.

Note: social IdP credentials are **secrets**, not variables — configure those as GitHub Actions **Secrets** and map them into the CDK deploy step if you want CI to deploy infrastructure. They are never needed by the web build.

### Configuration Variables Reference

Where every configuration value lives, by sensitivity:

| Value | Goes in | How it's used |
| --- | --- | --- |
| `EXPO_PUBLIC_COGNITO_USER_POOL_ID` | GitHub Actions **Variables** | Web build-time config (CDK output `UserPoolId`) |
| `EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID` | GitHub Actions **Variables** | Web build-time config (CDK output `UserPoolClientId`) |
| `EXPO_PUBLIC_COGNITO_REGION` | GitHub Actions **Variables** | Web build-time config |
| `EXPO_PUBLIC_COGNITO_DOMAIN` | GitHub Actions **Variables** | Web build-time config (CDK output `CognitoDomain`) |
| `EXPO_PUBLIC_REDIRECT_URI` | GitHub Actions **Variables** | Web build-time config (CDK output `RedirectUri`) |
| `EXPO_PUBLIC_LOGOUT_URI` | GitHub Actions **Variables** | Web build-time config (CDK output `LogoutUri`) |
| `EXPO_PUBLIC_API_URL` | GitHub Actions **Variables** | Web build-time config (CDK output `ApiUrl`) |
| `REDIRECT_URI` / `LOGOUT_URI` / `COGNITO_DOMAIN_PREFIX` | CDK deploy environment (**Secrets** mapped as plain env if using CI, or local shell for manual deploys) | Non-sensitive Cognito client config |
| `GOOGLE_CLIENT_ID` | GitHub Actions **Secrets** (if deploying CDK via CI) | Social IdP registration — non-secret on its own but paired with the secret |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | GitHub Actions **Secrets** | Social IdP (passed to CDK as env at deploy time) |
| `AMAZON_CLIENT_ID` / `AMAZON_CLIENT_SECRET` | GitHub Actions **Secrets** | Social IdP (passed to CDK as env at deploy time) |
| `APPLE_CLIENT_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | GitHub Actions **Secrets** | Apple sign-in — private key generates the ES256 client-secret JWT per sign-in |
| `GOOGLE_CLIENT_SECRET` | AWS **Secrets Manager** (not a GitHub or env value) | Referenced by name at CDK deploy time; CloudFormation resolves it at deployment, never rendered into the template |

Notes:

- GitHub **Variables** (not Secrets) hold everything the public PWA build needs — these are all non-sensitive identifiers/URLs that would be visible in the app bundle anyway.
- Only IdP credentials and the CDK deploy env are considered secrets; if you deploy CDK locally rather than via CI, those never touch GitHub at all.
- AWS Secrets Manager secret name defaults to `heat-safety/google-client-secret` (JSON field `secret`); set `GOOGLE_CLIENT_SECRET_SECRETS_MANAGER_SECRET` at CDK deploy time only if you use a different name.

#### Storing the Google client secret in AWS Secrets Manager

The CDK stack reads the Google client secret as a JSON field named `secret`, so the Secrets Manager value must be a JSON object of the form:

```json
{
  "secret": "<your GOOGLE_CLIENT_SECRET string>"
}
```

Create it (one-time, per region you deploy to — must be the same region the CDK stack deploys to, e.g. `us-east-1`):

```bash
aws secretsmanager create-secret \
  --name heat-safety/google-client-secret \
  --region us-east-1 \
  --secret-string '{"secret":"<your GOOGLE_CLIENT_SECRET string>"}'
```

Or with an existing secret, update it:

```bash
aws secretsmanager put-secret-value \
  --secret-id heat-safety/google-client-secret \
  --region us-east-1 \
  --secret-string '{"secret":"<your GOOGLE_CLIENT_SECRET string>"}'
```

Verify:

```bash
aws secretsmanager describe-secret \
  --secret-id heat-safety/google-client-secret \
  --region us-east-1 \
  --query 'Name'
```

(CloudFormation's deploy role also needs `secretsmanager:GetSecretValue` on this secret; the default CDK bootstrap deploy role in the same account usually has account-wide access, but a scoped IAM policy may be needed in tighter environments.)

### Verifying the loop

1. Deploy CDK (see above) → copy outputs.
2. Set the GitHub variables → re-run the `Deploy web to GitHub Pages` workflow.
3. Open the Pages URL → tap **Sign In** → the Cognito hosted page should open; completing sign-in returns to the app signed in.
4. If Cognito shows `redirect_mismatch`, the Pages URL and `EXPO_PUBLIC_REDIRECT_URI`/`REDIRECT_URI` differ — make them byte-identical (trailing slash included) and redeploy both sides.
5. If the hosted page 404s at `https://<pages-origin>/<prefix>/oauth2/authorize`, `EXPO_PUBLIC_COGNITO_DOMAIN` is the bare prefix — set the full `https://<prefix>.auth.<region>.amazoncognito.com` URL and re-run the workflow.
6. If the hosted page shows only email sign-up (no Google button), the stack was deployed without `GOOGLE_CLIENT_ID` — check `list-identity-providers` (above) and redeploy CDK with the env exported (`set -a; source .env; set +a`).
