import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import { parseStream } from '@fast-csv/parse';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Readable } from 'stream';

const QUEUE_URL = process.env.QUEUE_URL || '';
const sqsClient = new SQSClient({});
const s3Client = new S3Client({});

// This should match the structure of your CSV file
type CsvRow = {
  name: string;
};

export const handler = async function (event: S3Event): Promise<void> {
  // Loop over all records in the event
  for (const record of event.Records) {
    // Fetch the object from S3
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: record.s3.bucket.name,
        Key: record.s3.object.key,
      }),
    );

    // Create a CsvParserStream from the response
    const csvStream = parseStream<CsvRow, CsvRow>(response.Body as Readable, {
      headers: true,
      ignoreEmpty: true,
    });

    // Loop over the CSV rows in the stream
    for await (const row of csvStream) {
      console.log(`Adding todo "${row.name}" to queue.`);
      // Send each row in the CSV to SQS
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify(row),
        }),
      );
    }
  }
};
