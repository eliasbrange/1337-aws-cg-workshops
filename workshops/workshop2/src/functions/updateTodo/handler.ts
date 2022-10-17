import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || '';
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async function (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  console.log(event);

  const todoId = event.pathParameters?.todoId;

  if (!event.body) {
    return {
      statusCode: 400,
      body: 'Missing body in request',
    };
  }

  const data = JSON.parse(event.body);

  const updateExpressions: string[] = [];
  const ExpressionAttributeValues: Record<string, any> = {};
  const ExpressionAttributeNames: Record<string, any> = {};

  if (typeof data.name === 'string' && data.name.length > 0) {
    updateExpressions.push('#N = :name');
    ExpressionAttributeValues[':name'] = data.name;
    ExpressionAttributeNames['#N'] = 'name';
  }

  if (typeof data.completed === 'boolean') {
    updateExpressions.push('#C = :completed');
    ExpressionAttributeValues[':completed'] = data.completed;
    ExpressionAttributeNames['#C'] = 'completed';
  }

  if (updateExpressions.length < 1) {
    // No attributes to update...
    return {
      statusCode: 400,
      body: 'No attributes to update in request',
    };
  }

  // Update updatedAt
  const timestamp = new Date().getTime();
  updateExpressions.push('#UA = :updatedAt');
  ExpressionAttributeValues[':updatedAt'] = timestamp;
  ExpressionAttributeNames['#UA'] = 'updatedAt';

  // Build update exporession
  const UpdateExpression = 'set ' + [...updateExpressions].join(', ');

  try {
    await client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          todoId,
        },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression,
        ExpressionAttributeValues,
        ExpressionAttributeNames,
      }),
    );
  } catch (err: any) {
    if (err instanceof ConditionalCheckFailedException) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Todo with ID ${todoId} not found`,
        }),
      };
    } else {
      throw err;
    }
  }

  return {
    statusCode: 204,
    body: '',
  };
};
