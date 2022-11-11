import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME || '';
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async function (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return {
      statusCode: 400,
      body: 'Missing body in request',
    };
  }

  const data = JSON.parse(event.body);

  if (typeof data.name !== 'string' || data.name.length < 1) {
    return {
      statusCode: 400,
      body: 'Missing name property in payload',
    };
  }

  const timestamp = new Date().getTime();

  const item = {
    todoId: uuidv4(),
    name: data.name,
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  console.log(`Todo ${item.todoId} created successfully`);
  return {
    statusCode: 201,
    body: JSON.stringify(item),
  };
};
