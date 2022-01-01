import { App } from "aws-cdk-lib";

import { PipelineStack } from "../lib/pipeline-stack";

const app = new App();

// eslint-disable-next-line no-new
new PipelineStack(app, "Pipeline", {
  domainName: app.node.tryGetContext("kylelaker/site:domainName"),
  cspReportUri: app.node.tryGetContext("kyelaker/site:reportUri"),
  connection: {
    repoName: "kylelaker/kylelaker.com",
    branch: "main",
    parameterName: "/pipelines/github/connection-arn",
  },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
