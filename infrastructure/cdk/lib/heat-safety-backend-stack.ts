import * as cdk from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import * as path from 'path'

// Redirect/logout URIs must match the deployed web origin exactly. Sourced
// from environment so GitHub Actions (or the operator) controls them without
// code changes. Defaults keep `cdk synth` working locally.
const redirectUri = process.env.REDIRECT_URI ?? 'https://charlesjnichols.github.io/mobile-coach-heat-safety/'
const logoutUri = process.env.LOGOUT_URI ?? redirectUri
const cognitoDomainPrefix = process.env.COGNITO_DOMAIN_PREFIX ?? 'mobile-heat-safety'

export class HeatSafetyBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
    })

    // Social identity providers federated into the pool. Each requires
    // external credentials supplied via environment (never committed).
    const socialProviders: cognito.IUserPoolIdentityProvider[] = []
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    if (googleClientId) {
      socialProviders.push(
        new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
          userPool,
          clientId: googleClientId,
          clientSecretValue: cdk.SecretValue.secretsManager(
            process.env.GOOGLE_CLIENT_SECRET_SECRETS_MANAGER_SECRET ?? 'heat-safety/google-client-secret',
            { jsonField: 'secret' }
          ),
          scopes: ['openid', 'email', 'profile'],
          attributeMapping: {
            email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          },
        })
      )
    }
    const facebookAppId = process.env.FACEBOOK_APP_ID
    const facebookAppSecret = process.env.FACEBOOK_APP_SECRET
    if (facebookAppId && facebookAppSecret) {
      socialProviders.push(
        new cognito.UserPoolIdentityProviderFacebook(this, 'FacebookProvider', {
          userPool,
          clientId: facebookAppId,
          clientSecret: facebookAppSecret,
          scopes: ['email', 'public_profile'],
          attributeMapping: {
            email: cognito.ProviderAttribute.FACEBOOK_EMAIL,
          },
        })
      )
    }
    const amazonClientId = process.env.AMAZON_CLIENT_ID
    const amazonClientSecret = process.env.AMAZON_CLIENT_SECRET
    if (amazonClientId && amazonClientSecret) {
      socialProviders.push(
        new cognito.UserPoolIdentityProviderAmazon(this, 'AmazonProvider', {
          userPool,
          clientId: amazonClientId,
          clientSecret: amazonClientSecret,
          scopes: ['profile'],
          attributeMapping: {
            email: cognito.ProviderAttribute.AMAZON_EMAIL,
          },
        })
      )
    }
    const appleClientId = process.env.APPLE_CLIENT_ID
    const appleTeamId = process.env.APPLE_TEAM_ID
    const appleKeyId = process.env.APPLE_KEY_ID
    const applePrivateKey = process.env.APPLE_PRIVATE_KEY
    if (appleClientId && appleTeamId && appleKeyId && applePrivateKey) {
      socialProviders.push(
        new cognito.UserPoolIdentityProviderApple(this, 'AppleProvider', {
          userPool,
          clientId: appleClientId,
          teamId: appleTeamId,
          keyId: appleKeyId,
          privateKey: applePrivateKey,
          scopes: ['name', 'email'],
          attributeMapping: {
            email: cognito.ProviderAttribute.other('email'),
          },
        })
      )
    }

    // Hosted UI domain — serves the sign-in page and OAuth endpoints.
    userPool.addDomain('CognitoDomain', {
      cognitoDomain: { domainPrefix: cognitoDomainPrefix },
    })

    const supportedIdentityProviders: cognito.UserPoolClientIdentityProvider[] = [
      cognito.UserPoolClientIdentityProvider.COGNITO,
      ...socialProviders.map((provider) => {
        if (provider instanceof cognito.UserPoolIdentityProviderGoogle) {
          return cognito.UserPoolClientIdentityProvider.GOOGLE
        }
        if (provider instanceof cognito.UserPoolIdentityProviderFacebook) {
          return cognito.UserPoolClientIdentityProvider.FACEBOOK
        }
        if (provider instanceof cognito.UserPoolIdentityProviderAmazon) {
          return cognito.UserPoolClientIdentityProvider.AMAZON
        }
        return cognito.UserPoolClientIdentityProvider.custom('SignInWithApple')
      }),
    ]

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: false,
        userSrp: false,
      },
      supportedIdentityProviders,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.EMAIL,
        ],
        callbackUrls: [redirectUri],
        logoutUrls: [logoutUri],
      },
    })

    const table = new dynamodb.Table(this, 'HeatSafetyTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const syncLambda = new nodejs.NodejsFunction(this, 'SyncHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.syncHandler',
      entry: path.join(__dirname, '..', '..', '..', 'services', 'api', 'src', 'index.ts'),
      environment: {
        TABLE_NAME: table.tableName,
      },
      // No `nodeModules` — esbuild bundles sources (incl. workspace TS) locally,
      // so Docker is not required for synth/deploy.
    })

    table.grantReadWriteData(syncLambda)

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      cognitoUserPools: [userPool],
    })

    const api = new apigateway.RestApi(this, 'HeatSafetyApi', {
      restApiName: 'heat-safety-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    })

    const sync = api.root.addResource('sync')
    sync.addMethod('GET', new apigateway.LambdaIntegration(syncLambda), {
      authorizer,
    })
    sync.addMethod('PUT', new apigateway.LambdaIntegration(syncLambda), {
      authorizer,
    })

    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId })
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId })
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url })
    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: `https://${cognitoDomainPrefix}.auth.${cdk.Stack.of(this).region}.amazoncognito.com`,
    })
    new cdk.CfnOutput(this, 'RedirectUri', { value: redirectUri })
    new cdk.CfnOutput(this, 'LogoutUri', { value: logoutUri })
  }
}
