import { EventBridgeEvent } from 'aws-lambda';
import { todoItem } from '../common';

export const handler = async function (
  event: EventBridgeEvent<'TodoDeleted', todoItem>,
): Promise<void> {
  console.log(`Todo ${event.detail.todoId} deleted`, event);
};
