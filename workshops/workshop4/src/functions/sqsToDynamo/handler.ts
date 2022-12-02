import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = process.env.TABLE_NAME || '';
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

type Record = {
  name: string;
};

export const handler = async function (event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    const data = JSON.parse(record.body) as Record;
    console.log(`Importing todo item with name "${data.name}"`);

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
  }
};
