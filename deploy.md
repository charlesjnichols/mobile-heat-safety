# AWS Deployment Guide

This guide deploys the Heat Safety Tracker serverless backend using AWS CDK.

## Services Used

| Service | Purpose |
| --- | --- |
| AWS Cognito | User authentication (sign-up, verification, JWT tokens) |
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
- Creates a User Pool Client (`generateSecret: false`, `USER_PASSWORD_AUTH` flow) — used by the mobile app via `amazon-cognito-identity-js`.
- After deploy, retrieve the client config from stack outputs:

  ```bash
  aws cloudformation describe-stacks \
    --stack-name <StackName> \
    --query 'Stacks[0].Outputs'
  ```

  Outputs: `UserPoolId`, `UserPoolClientId`, `ApiUrl`. Feed these into the mobile app's sync/auth configuration.

### AWS API Gateway (REST)

- Creates REST API `heat-safety-api` with `GET /sync` and `PUT /sync`.
- Routes are protected by a Cognito User Pools authorizer; requests must carry a valid Cognito JWT (`Authorization` header).
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
aws cloudformation cancel-update-stack --stack-name <StackName>
```

## Verify the Deployment

```bash
# Check stack outputs
aws cloudformation describe-stacks --stack-name <StackName> \
  --query 'Stacks[0].Outputs' --output table

# Check the API is reachable (401 expected without a token)
curl -i "$(aws cloudformation describe-stacks --stack-name <StackName> \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)sync"

# Confirm the DynamoDB table exists
aws dynamodb describe-table --table-name <TableName>
```

## Teardown

```bash
npm run cdk --workspace @coaching-code/infrastructure -- destroy
```

Note: the DynamoDB table is destroyed with the stack (see removal policy above).

## Deploying the Mobile Client

The Expo app (`apps/mobile`) is not deployed by CDK. Build and publish via EAS:

```bash
npm run android --workspace @coaching-code/mobile   # local device run
# or
npx eas build --platform all                        # EAS build
npx eas update                                      # OTA update
```

Configure the app with the deployed `ApiUrl`, `UserPoolId`, and `UserPoolClientId` stack outputs.
