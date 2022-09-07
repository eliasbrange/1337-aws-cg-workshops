# AWS Development Competence Group

This repository hosts the workshops for the AWS Development Competence Group. Please follow the list below to be ready for the first workshop.

## Prerequisites

To save time in the workshops, please complete this steps before the first workshop.

### Install required tools/CLIs

1. Install [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)

   ```
   $ npm install -g yarn
   ```

1. Install [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)

   ```
   yarn global add aws-cdk
   ```

1. Install [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

   - Will be used to run Lambda functions locally

1. Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

   - Install the v2 variant

### Setup local AWS Profile using SSO

You can avoid having to copy access keys back and forth between the AWS Management Console and the terminal by setting up a local profile with SSO. You can read more about named profiles [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html).

#### 1. Create a named profile in the credentials file

Create a file `~/.aws/credentials` if it doesn't exist. Open the file and add the following:

```
[your-profile-name]
sso_start_url = https://tretton37.awsapps.com/start
sso_region = eu-north-1
sso_account_id = YOUR_ACCOUNT_NUMBER
sso_role_name = AdministratorAccess
```

You can find your account number on the AWS SSO login page. You can have multiple profiles in this file. For example, you might want both a `1337-admin` and `1337-read` profile.

#### 2. Try it out

In your current terminal, run the following command:

```
$ export AWS_PROFILE=your-profile-name

$ aws sso login

Attempting to automatically open the SSO authorization page in your default browser.
...
```

This should send you to the AWS Management Console to authorize the login. When done, you should be able to use the AWS CLI in your terminal.

### Bootstrap environment for use with AWS CDK

You need to bootstrap your AWS account to be able to use CDK. The bootstrap process will create all needed resources for you. These resources include an Amazon S3 bucket for storing files and IAM roles that grant permissions needed to perform deployments.

Read more about bootstrapping [here](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html).

```
$ cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```
