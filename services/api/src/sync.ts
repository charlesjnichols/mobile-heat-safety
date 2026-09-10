import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { HeatSafetyDataSchema, validateHeatSafetyData } from '@coaching-code/domain'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.TABLE_NAME ?? 'HeatSafetyData'
const PK_PREFIX = 'USER#'

interface SyncRequest {
  data: unknown
  lastSync?: string | null
}

const json = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  },
  body: JSON.stringify(body),
})

const userIdFromEvent = (event: APIGatewayProxyEvent): string | null => {
  const claims = event.requestContext.authorizer?.claims
  if (!claims) return null
  return claims.sub ?? claims.username ?? null
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {})
  }

  const userId = userIdFromEvent(event)
  if (!userId) {
    return json(401, { success: false, message: 'Unauthorized' })
  }

  const key = { pk: `${PK_PREFIX}${userId}` }

  if (event.httpMethod === 'GET') {
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: key })
    )
    const item = result.Item
    if (!item || !item.data) {
      return json(200, { success: true, data: null })
    }
    return json(200, { success: true, data: item.data, lastSync: item.lastSync ?? null })
  }

  if (event.httpMethod === 'PUT') {
    const body = JSON.parse(event.body ?? '{}') as SyncRequest
    const parsed = HeatSafetyDataSchema.safeParse(body.data)
    if (!parsed.success) {
      return json(400, {
        success: false,
        message: 'Invalid payload',
        errors: parsed.error.errors.map(e => e.message),
      })
    }
    const data = validateHeatSafetyData(body.data)
    const now = new Date().toISOString()
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...key,
          data,
          lastSync: body.lastSync ?? now,
          updatedAt: now,
        },
      })
    )
    return json(200, { success: true, data, lastSync: now })
  }

  return json(405, { success: false, message: 'Method not allowed' })
}
