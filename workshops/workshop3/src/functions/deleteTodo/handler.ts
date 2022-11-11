import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || '';
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async function (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const todoId = event.pathParameters?.todoId;

  try {
    await client.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          todoId,
        },
        ConditionExpression: 'attribute_exists(todoId)',
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

  console.log(`Todo ${todoId} deleted successfully`);
  return {
    statusCode: 204,
    body: '',
  };
};
