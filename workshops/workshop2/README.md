# Workshop 2: Events

## 1. Introduction

Many cloud (and especially serverless) applications today use Event-Driven Architecture. In EDA, services communicate asynchronously by producing and consuming **events**. Some benefits of event-driven architecture include:

- **Loose coupling:** Services can communicate via an event broker. Producers do not need to know the inner workings of consumers and vice versa.

- **Fault tolerance:** Asynchronous messaging allows for retry logic in every service. If a consumer fails, it can retry the event instead of having the producer re-send it.

- **Independent teams:** Teams can build and ship features independent of each other. It is easy to hook up a new consumer to an existing event. This requires good documentation and schema practices.

In this workshop, you will build upon the application from the previous workshop. You will explore DynamoDB streams, EventBridge, and SNS Topics. These are some of the ways on AWS to send events between services in an asynchronous manner.

Whenever an item is created, deleted, or modified in the DynamoDB Table, an event will be sent out to a DynamoDB stream. These events include a snapshot of each DynamoDB item both before and after modification. You will add a Lambda function to this stream that sends three different events to an EventBridge Bus:

- **TodoCreated**: Event sent when a to-do item is created.
- **TodoCompleted**: Event sent when the `completed` attribute on an item is changed from `false` to `true`.
- **TodoDeleted**: Event sent when a to-do item is deleted.

You will then create three Lambda functions. Each function will handle a separate type of event by setting up target rules in EventBridge.

Finally, you will create an SNS topic and subscribe to it with your e-mail. Every time you mark a todo as completed, you will get a notification in your e-mail inbox.

![Workshop 2 Diagram](workshop2.diagram.png)

### What are DynamoDB streams?

> "DynamoDB Streams captures a time-ordered sequence of item-level modifications in any DynamoDB table and stores this information in a log for up to 24 hours. Applications can access this log and view the data items as they appeared before and after they were modified, in near-real time." - [AWS Docs](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)

DynamoDB streams enable a wide range of use cases and patterns. It captures every item-level modification made to a table, ordered by time. You can then, for example, hook up a Lambda function to this stream to do further processing.

Some use cases include:

- **Replication:** Streams make it easy to replicate data between two tables by mirroring all events to another table. This is useful when doing a database migration between accounts. You can also use it to create a local copy of the database in another region for faster access in that region.
- **Indexing:** NoSQL databases are not particularly good for searching and filtering. Streams can help with this by indexing every item in an ElasticSearch cluster or similar.
- **Aggregations:** As with searching, NoSQL databases are not designed to perform ad-hoc aggregations. Using streams, you can aggregate data to another table.
- **Events:** Streams makes it easy to build a service than emit events every time you modify an item in a table.

In this workshop, you will use streams to publish events when a to-do item is created, marked as completed, or deleted.

### What is EventBridge?

> "Amazon EventBridge is a serverless event bus service that you can use to connect your applications with data from a variety of sources. EventBridge delivers a stream of real-time data from your applications, software as a service (SaaS) applications, and AWS services to targets such as AWS Lambda functions, HTTP invocation endpoints using API destinations, or event buses in other AWS accounts." - [AWS Docs](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html)

EventBridge is the heart of many serverless event-driven applications. It provides a flexible and scalable way to publish and consume events. The event bus evaluates all incoming events against any rules you have created. These rules can then route events to a many different targets such as Lambda functions.

It also comes with advance functionality, such as event transformation and replay functionality.

In this workshop, you will use EventBridge as an event bus to route events to different Lambda functions.

### What is SNS?

> "Amazon Simple Notification Service (Amazon SNS) is a managed service that provides message delivery from publishers to subscribers (also known as producers and consumers). Publishers communicate asynchronously with subscribers by sending messages to a topic, which is a logical access point and communication channel. Clients can subscribe to the SNS topic and receive published messages using a supported endpoint type, such as Amazon Kinesis Data Firehose, Amazon SQS, AWS Lambda, HTTP, email, mobile push notifications, and mobile text messages (SMS)." - [AWS Docs](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)

Like EventBridge, SNS can be used for asynchronous Pub-Sub communication. Before EventBridge was released, SNS was the go-to service to implement fan-out patterns (one event sent to many consumers). But, SNS still has a purpose with its generous throughput and subscription limits. You can have up to 12.5 MILLION subscribers on a single SNS topic.

[This blog post](https://medium.com/awesome-cloud/aws-difference-between-amazon-eventbridge-and-amazon-sns-comparison-aws-eventbridge-vs-aws-sns-46708bf5313) goes over some of the differences (and similarities) between SNS and EventBridge.

In this workshop, you will subscribe to an SNS topic with your e-mail to get notifications when you mark a to-do item as completed.

### Continuing from Workshop 1

This workshop builds upon the API built in [Workshop 1](../workshop1/README.md). If you haven't completed that one, I have provided a starting point in [workshops/workshop2/src](./src/) which you can use. In workshop 1, you built a simple Todo API with the following routes which you will use throughout this workshop:

- **GET /todo** - Lists all to-do items in the application, with support for pagination through `limit` and `next_token` query parameters.

- **GET /todo/{todoId}** - Fetches a single to-do item.

- **POST /todo** - Creates a new to-do item. Requires a `name` parameter in the payload.

- **UPDATE /todo/{todoId}** - Updates a to-do item. Accepts `name` and `completed` parameter in the payload.

- **DELETE /todo/{todoId}** - Deletes a to-do item.

## 2. COMING SOON!
