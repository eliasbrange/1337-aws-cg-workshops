import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export class TodoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new Table(this, 'TodoTable', {
      partitionKey: {
        name: 'todoId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    // Lambda Functions
    const commonFunctionProps: NodejsFunctionProps = {
      handler: 'handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(29),
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        minify: true,
      },
    };

    const getFunction = new NodejsFunction(this, 'GetTodoFunction', {
      entry: 'functions/getTodo/handler.ts',
      ...commonFunctionProps,
    });
    const listFunction = new NodejsFunction(this, 'ListTodoFunction', {
      entry: 'functions/listTodos/handler.ts',
      ...commonFunctionProps,
    });
    const createFunction = new NodejsFunction(this, 'CreateTodoFunction', {
      entry: 'functions/createTodo/handler.ts',
      ...commonFunctionProps,
    });
    const updateFunction = new NodejsFunction(this, 'UpdateTodoFunction', {
      entry: 'functions/updateTodo/handler.ts',
      ...commonFunctionProps,
    });
    const deleteFunction = new NodejsFunction(this, 'DeleteTodoFunction', {
      entry: 'functions/deleteTodo/handler.ts',
      ...commonFunctionProps,
    });

    // Add Lambda runtime permissions
    table.grantReadData(getFunction);
    table.grantReadData(listFunction);
    table.grantWriteData(createFunction);
    table.grantWriteData(updateFunction);
    table.grantWriteData(deleteFunction);

    // REST API
    const restApi = new RestApi(this, 'RestApi', {});

    const todos = restApi.root.addResource('todo');
    todos.addMethod('GET', new LambdaIntegration(listFunction));
    todos.addMethod('POST', new LambdaIntegration(createFunction));

    const todo = todos.addResource('{todoId}');
    todo.addMethod('GET', new LambdaIntegration(getFunction));
    todo.addMethod('PATCH', new LambdaIntegration(updateFunction));
    todo.addMethod('DELETE', new LambdaIntegration(deleteFunction));
  }
}
