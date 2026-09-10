#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { HeatSafetyBackendStack } from '../lib/heat-safety-backend-stack'

const app = new cdk.App()
new HeatSafetyBackendStack(app, 'HeatSafetyBackend', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
})
