import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommandInput,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || '';
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async function (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  console.log(event);

  const limit = parseInt(event.queryStringParameters?.limit || '10');
  const nextToken = event.queryStringParameters?.next_token;

  const params: ScanCommandInput = {
    TableName: TABLE_NAME,
    Limit: limit,
  };

  if (nextToken) {
    params['ExclusiveStartKey'] = decodeToken(nextToken);
  }

  const scanResponse = await client.send(new ScanCommand(params));

  const response = {
    nextToken: encodeToken(scanResponse.LastEvaluatedKey),
    items: scanResponse.Items?.map((item) => {
      return {
        todoId: item.todoId,
        name: item.name,
        completed: item.completed,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    }),
  };

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};

const encodeToken = (text: any): string | undefined => {
  if (text === undefined) {
    return undefined;
  }

  return Buffer.from(JSON.stringify(text), 'binary').toString('base64');
};

const decodeToken = (base64: string): Record<string, any> => {
  return JSON.parse(Buffer.from(base64, 'base64').toString('binary'));
};
