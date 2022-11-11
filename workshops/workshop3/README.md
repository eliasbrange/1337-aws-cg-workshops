# Workshop 3: Scalable import process

## 1. Introduction

![Workshop 3 Diagram](workshop3.diagram.png)

### What is S3?

> "Amazon Simple Storage Service (Amazon S3) is an object storage service that offers industry-leading scalability, data availability, security, and performance. Customers of all sizes and industries can use Amazon S3 to store and protect any amount of data for a range of use cases, such as data lakes, websites, mobile applications, backup and restore, archive, enterprise applications, IoT devices, and big data analytics. Amazon S3 provides management features so that you can optimize, organize, and configure access to your data to meet your specific business, organizational, and compliance requirements." - [AWS Docs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)

In this workshop you will use S3 to upload CSV files containing todo items. Each row in these files will then be imported into the DynamoDB table.

### What is SQS?

> "Amazon Simple Queue Service (Amazon SQS) offers a secure, durable, and available hosted queue that lets you integrate and decouple distributed software systems and components. Amazon SQS offers common constructs such as dead-letter queues and cost allocation tags. It provides a generic web services API that you can access using any programming language that the AWS SDK supports." - [AWS Docs](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)

One of the use cases for SQS is to implement 1:1 asynchronous messaging. In this workshop, you will use it as a buffer queue to make sure the import service is scalable. In the diagram above, you could write items to DynamoDB from the S3ToSqs function. But what if you uploaded a file with a million rows, or if the database is unavailable at the time of import? If the database is unavailable or throttled, or if your lambda function times out, you would lose data.

By using SQS as a buffer, the first Lambda function can read the file and add each row as a separate item on the queue. The second Lambda function can then read items in smaller batches from this queue and insert them into the table. If the database fails in this case, you can add retry mechanisms and dead-letter-queues to create a resilient process.

### Continuing from previous workshops

This workshop continues from where we left off in the [previous workshop](../workshop2/README.md). If you haven't completed that one, I have provided a starting point in [workshops/workshop3/src](./src/) which you can use.

## 2. Create an S3 bucket and SQS Queue

Start by creating the required infrastructure in `lib/todo-app-stack.ts`:

```typescript
...
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Queue } from 'aws-cdk-lib/aws-sqs';

...

export class TodoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    ...

    // S3 Bucket
    const bucket = new Bucket(this, 'TodoImportBucket');

    // Import Queue
    const queue = new Queue(this, 'TodoImportQueue', {
      visibilityTimeout: cdk.Duration.seconds(120),
    });

    ...

    // Outputs
    new cdk.CfnOutput(this, 'TodoImportBucketOutput', {
      value: bucket.bucketName,
    });

```

## 3. Create Lambda function to handle S3 events

In the `functions/` directory, add a new sub-directory named `s3ToSqs` and add a file `handler.ts` with the following contents:

```typescript
import { S3Event } from "aws-lambda";

export const handler = async function (event: S3Event): Promise<void> {
  for await (const record of event.Records) {
    console.log(record);
  }
};
```

Add the function to your CDK application in `lib/todo-stack-app.ts`:

```typescript
const s3ToSqsFunction = new NodejsFunction(this, "S3ToSqsFunction", {
  entry: "functions/s3ToSqs/handler.ts",
  ...commonFunctionProps,
  timeout: cdk.Duration.seconds(900),
  environment: {
    QUEUE_URL: queue.queueUrl,
  },
});
```

## 4. Set up integration between S3 and S3ToSqs function

You will now set up the integration between S3 and the S3ToSqs function. There are a bunch of available [event types](https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-event-types-and-destinations.html#supported-notification-event-types) to listen to. In your service, you want your function to trigger when an item is uploaded to the bucket, i.e. `s3:ObjectCreated:*`. You can also specify a prefix for event notifications. This is useful when a bucket has multiple purposes. You are perhaps storing files to be imported under the `import/` prefix and archives under the the `archive/` prefix. In this case, you would not want to trigger an import when an archive is uploaded.

In `lib/todo-app-stack.ts`, add/update the following imports:

```typescript
import { Bucket, EventType } from "aws-cdk-lib/aws-s3"; // add EventType to this import
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
```

Then, add the integration between S3 and Lambda:

```typescript
// S3 integration
bucket.addEventNotification(
  EventType.OBJECT_CREATED,
  new LambdaDestination(s3ToSqsFunction),
  { prefix: "import/" }
);
```

### Deploy and test the integration

1.  Deploy your application with `cdk deploy`. You should get the name of the S3 bucket in the console output like so:

    ```
    Outputs:
    TodoAppStack.RestApiEndpoint0551178A = ...
    TodoAppStack.TodoImportBucketOutput = todoappstack-todoimportbucket9bc2d041-12345678  <--
    ```

2.  Either tail the logs with the `sam cli` or find the logs of your newly deployed **S3ToSqs** function. You can tail the logs with the following command:

    ```
    sam logs --stack-name TodoAppStack --tail
    ```

3.  Create a `todos.csv` file and add a few todo items:

    ```
    name
    todo1
    todo2
    todo3
    todo4
    todo5
    todo6
    todo7
    todo8
    todo9
    todo10
    ```

4.  Upload this file to S3 by using the `aws cli`:

    ```bash
    $ aws s3 cp todos.csv s3://todoappstack-todoimportbucket9bc2d041-12345678/import/todos.csv

    upload: ./todos.csv to s3://todoappstack-todoimportbucket9bc2d041-12345678/import/todos.csv
    ```

5.  You should see a log entry with the following structure:

    ```
    2022-11-11T10:23:27.986Z        9df470f3-8e0c-420a-9408-f7cae5f45baa  INFO    {
        eventVersion: '2.1',
        eventSource: 'aws:s3',
        awsRegion: 'eu-west-1',
        eventTime: '2022-11-11T10:23:26.595Z',
        eventName: 'ObjectCreated:Put',
        userIdentity: { principalId: '...' },
        requestParameters: { sourceIPAddress: '...' },
        responseElements: {
            'x-amz-request-id': '...',
            'x-amz-id-2': '...'
        },
        s3: {
            s3SchemaVersion: '1.0',
            configurationId: '...',
            bucket: {
                name: 'todoappstack-todoimportbucket9bc2d041-12345678',
                ownerIdentity: [Object],
                arn: 'arn:aws:s3:::todoappstack-todoimportbucket9bc2d041-12345678'
            },
            object: {
                key: 'import/todos.csv',
                size: 66,
                eTag: '...',
                sequencer: '...'
            }
        }
    }
    ```

6.  From this log you can see on the `eventName` that an object was created in the bucket. You can also see from which bucket this event originated from via `s3.bucket.name` and the key of the object in `s3.object.key`.

## 6. Grant permissions to the S3ToSqs function

Before adding more logic to the **S3ToSqs** function you need to grant permissions to both S3 and SQS. As you can see in the event above, only metadata about the object is included in the event. You will need to download the contents of the object separately inside the lambda function.

In `lib/todo-app-stack.ts`, add the following permissions:

```typescript
    // Add Lambda runtime permissions
    ...
    bucket.grantRead(s3ToSqsFunction);
    queue.grantSendMessages(s3ToSqsFunction);
```

## 7. Update S3ToSqs function logic to send items to SQS

Time to add some logic to the **S3ToSqs** function. First, you will need to install a few dependenices:

```bash
$ yarn add @fast-csv/parse @aws-sdk/client-s3 @aws-sdk/client-sqs
```

Now, open `functions/s3ToSqs/handler.ts` and add the following imports and top-level constants:

```typescript
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { parseStream } from "@fast-csv/parse";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Readable } from "stream";

const QUEUE_URL = process.env.QUEUE_URL || "";
const sqsClient = new SQSClient({});
const s3Client = new S3Client({});

// This should match the structure of your CSV file
type CsvRow = {
  name: string;
};
```

Now let's implement the `handler` function. Since `event` can contain multiple records in `event.Records` you need to loop over them. For each record, you then want to:

1. Download the object from S3.
2. Pass the downloaded stream to a CSV reader.
3. Publish a message to SQS with the contents of each row in the CSV file.

Downloading an object with the `aws sdk` can be done like this:

```typescript
const response = await s3Client.send(
  new GetObjectCommand({
    Bucket: "YOUR_BUCKET_NAME",
    Key: "path/to/your/object.csv",
  })
);
```

You can then pass the response stream to the CSV reader added with the `@fast-csv/parse` dependency:

```typescript
const csvStream = parseStream<T, T>(response.Body as Readable, {
  headers: true,
  ignoreEmpty: true,
});
```

Here, you can specify the row `type` by replacing the `T` types with your own `CsvRow` type. You can also see that we need to cast `response.Body` to `Readable`. This is because the `GetObjectCommand` returns different types depending on if the execution context is in a browser or in Node for example.

The options `headers: true` tells the parser to strip away the first row in the CSV file, and `ignoreEmpty` does what it says. It ignores empty lines.

With the stream constructed, you can then loop over the rows with:

```typescript
for await (const row of csvStream) {
  // Do something with row here
}
```

You want to send each row to the SQS queue. You can send messages using the following snippet:

```typescript
await sqsClient.send(
  new SendMessageCommand({
    QueueUrl: "YOUR_QUEUE_URL",
    MessageBody: JSON.stringify(YOUR_DATA),
  })
);
```

With the above parts you should be able to combine them into a handler that fulfils the requirements stated earlier.

**Need help? Below is a spoiler on how the file could look when done:**

<details>
<summary>S3ToSqs function handler spoiler</summary>

```typescript
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { parseStream } from "@fast-csv/parse";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Readable } from "stream";

const QUEUE_URL = process.env.QUEUE_URL || "";
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
      })
    );

    // Create a CsvParserStream from the response
    const csvStream = parseStream<CsvRow, CsvRow>(response.Body as Readable, {
      headers: true,
      ignoreEmpty: true,
    });

    // Loop over the CSV rows in the stream
    for (const row of csvStream) {
      console.log(`Adding todo "${row.name}" to queue.`);
      // Send each row in the CSV to SQS
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify(row),
        })
      );
    }
  }
};
```

</details>

### Deploy and verify SQS messages

Deploy your application again and upload a file to S3 (you can override the existing file by uploading the same file over and over). You should see logs that look like this in the **S3ToSqs** function:

```
2022-11-11T12:34:03.679Z        f906bdac-e795-4817-873d-93856082bf95  INFO    Adding todo "todo1" to queue.
2022-11-11T12:34:03.686Z        f906bdac-e795-4817-873d-93856082bf95  INFO    Adding todo "todo2" to queue.
2022-11-11T12:34:03.693Z        f906bdac-e795-4817-873d-93856082bf95  INFO    Adding todo "todo3" to queue.
2022-11-11T12:34:03.701Z        f906bdac-e795-4817-873d-93856082bf95  INFO    Adding todo "todo4" to queue.
2022-11-11T12:34:03.708Z        f906bdac-e795-4817-873d-93856082bf95  INFO    Adding todo "todo5" to queue.
2022-11-11T12:34:03.718Z        f906bdac-e795-4817-873d-93856082bf95  INFO    Adding todo "todo6" to queue.
2022-11-11T12:34:03.725Z        f906bdac-e795-4817-873d-93856082bf95  INFO    Adding todo "todo7" to queue.
2022-11-11T12:34:03.733Z        f906bdac-e795-4817-873d-93856082bf95  INFO    Adding todo "todo8" to queue.
2022-11-11T12:34:03.741Z        f906bdac-e795-4817-873d-93856082bf95  INFO    Adding todo "todo9" to queue.
2022-11-11T12:34:03.748Z        f906bdac-e795-4817-873d-93856082bf95  INFO    Adding todo "todo10" to queue.
```

Navigate to the [SQS console](https://eu-west-1.console.aws.amazon.com/sqs/v2/home) (and make sure you are in the correct region). You should see your queue and that you have a non-zero number in the _Messages available_ column. Take a look at some of the messages:

1. Click the link with the name of the queue.
1. On the next page, click the _Send and receive messages_ button in the top right.
1. In the bottom _Receive messages_ section, click the _Poll for messages_ button.
1. You should see some messages appear in the table, click on one of them.
1. You should see a message _Body_ with a value similar to `{"name":"todo5"}`

## 9. Create Lambda function to handle SQS events

Now that you have messages waiting on the queue, 

## 10. Set up integration between SQS and SqsToDynamo function

## 11. Update SqsToDynamo configuration and permissions

## 12. Update SqsToDynamo function to write items to DynamoDB
