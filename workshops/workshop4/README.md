# Workshop 4: Continued exploration

## 1. Introduction

In the fourth and final workshop, you will focus on continued exploration in a freeform format with no staked path. You may continue from where you left off last time and continue to improve the service you have built over the past three workshops. If you need a starting point, look in the src directory.

In the next section, you will find some inspiration for potential areas to explore further. The possibilities are endless, and if you have anything specific in mind you want to explore outside of these areas, go ahead.

Some potential areas to explore include:

- Observability: Logging, Metrics, and Tracing
- Separate application into smaller deployment units
- Deploy from GitHub Actions
- API-level request validation

## 2. Exploration areas

### Observability with Powertools: Logging, Metrics, and Tracing

AWS CloudWatch contains a suite of tools to help implement observability in your systems. You can use CloudWatch Logs Insights to query structured log records across services, CloudWatch Metrics to track operational and custom business metrics, and CloudWatch X-Ray to capture traces of distributed requests.

There is a tool that makes it simple to integrate logging, metrics, and tracing in your Lambda-based workloads called AWS Lambda Powertools for Typescript.

Try out this tool to add structure to your existing log entries. You will see that the library comes with sane defaults out of the box, allowing you to get a good observability baseline without much effort.

You can also experiment with adding custom metrics. You can, for example, track the number of created or completed to-do items or the number of completed import jobs.

Finally, you can look into adding tracing to your API Gateway and Lambda functions. You need to enable the tracing capability on said resources in your CDK application to do this.

**Resources**

- [Lambda Powertools Documentation](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/)
- [Powertools CDK example project](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/examples/cdk)
- [Blog post by yours truly (Python & AWS SAM)](https://www.eliasbrange.dev/posts/observability-with-fastapi-aws-lambda-powertools/)

### Separate application into smaller deployment units

As services grow, they tend to become more complex. The to-do service currently comprises a single CloudFormation stack. For example, you must redeploy the entire application to update a single Lambda function in the API.

One way of combating the complexity is to split up a service into smaller parts that can be built and deployed separately. CDK supports this by allowing you to define multiple stacks in your CDK application. Right now, in `bin/todo-app.ts` you have a single stack, the `TodoAppStack`. This stack, `lib/todo-app-stack.ts`, contains everything in your service, such as the API, database, event rules, s3 bucket, etc.

Think about the structure of the service and how you could split it up into multiple deployment units. What parts would make sense to deploy together? Are there any advantages to deploying stateless and stateful resources separately?

Find a partitioning that works for you, and add one or more smaller stacks to the CDK application.

**Resources**

- [Referencing resources between CDK stacks](https://docs.aws.amazon.com/cdk/v2/guide/resources.html#resource_stack)

### Deploy from GitHub Actions

Manually deploying services can help when prototyping and learning. But in a production scenario, a CI system should perform deployments in a controlled environment.

GitHub Actions is a popular service for running workflows linked to the CI/CD process. Create a repository with a simple workflow that performs a `cdk deploy` on every push to the `main` branch.

You can build as advanced pipelines as you require on GitHub Actions. You could add different workflows for pushes to the `main` branch versus commits to a pull request.

Traditionally, to authenticate between GitHub and AWS, you create an IAM user in AWS and store its access credentials in a repository secret. However, you can now use GitHub OIDC to generate temporary access credentials on the fly in each workflow run. OIDC comes with the benefit of not having to manage the lifecycle of long-lived credentials.

To use OIDC, you must set up GitHub as a trusted identity provider in your AWS account. You then have to create an IAM role that your GitHub Actions workflow will assume. This IAM role will need enough permissions to deploy and manage your services. You will also need to specify in the role's trust policy which GitHub repositories will be allowed to assume it.

AWS recommends creating roles with the least permissions required to fulfill their tasks. Following the principle of least privilege is a challenge with deployment roles since they need to be able to create, update and delete resources. To not spend the entire workshop on defining these permissions, you can start with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowedServices",
      "Effect": "Allow",
      "Action": [
        "apigateway:*",
        "cloudformation:*",
        "dynamodb:*",
        "events:*",
        "lambda:*",
        "s3:*",
        "sqs:*",
        "sns:*",
        "ssm:*",
        "logs:*",
        "cloudwatch:*",
        "iam:*"
      ],
      "Resource": "*"
    }
  ]
}
```

NOTE: Be careful when creating the role's trust policy. Anyone with access to the repository (or repositories) you specify will be able to use the role to access your AWS account.

**Resources**

- [Blog post by yours truly on setting up OIDC](https://www.eliasbrange.dev/posts/secure-aws-deploys-from-github-actions-with-oidc/)
- [GitHub Actions docs](https://docs.github.com/en/actions)

### Testing the API

We haven't touched on the subject of testing during the workshops. One thing you could look into is integration tests for the Rest API using `jest` or some other tool. You could write tests for all the routes and ensure they return the correct data structure and status codes. You can also test that you get validation errors when the payload has the wrong format or is missing entirely.

**Resources**

- [Jest getting started documentation](https://jestjs.io/docs/getting-started)
