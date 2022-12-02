import { EventBridgeEvent } from 'aws-lambda';
import { todoItem } from '../common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const TOPIC_ARN = process.env.TOPIC_ARN || '';
const snsClient = new SNSClient({});

export const handler = async function (
  event: EventBridgeEvent<'TodoCompleted', todoItem>,
): Promise<void> {
  console.log(`Todo ${event.detail.todoId} completed`, event);
  await snsClient.send(
    new PublishCommand({
      TopicArn: TOPIC_ARN,
      Subject: `Todo with name "${event.detail.name}" completed.`,
      Message: `A todo was marked as completed. \n\ntodoId: ${event.detail.todoId} \nname: ${event.detail.name}`,
    }),
  );
};
