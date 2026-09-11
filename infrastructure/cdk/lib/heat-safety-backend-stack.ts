import * as cdk from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import * as path from 'path'

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

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
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
  }
}
