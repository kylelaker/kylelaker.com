import { Stack, StackProps } from "aws-cdk-lib";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import * as pipelines from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { SiteStage } from "./site-stage";

export interface ConnectionOptions {
  repoName: string;
  branch: string;
  parameterName: string;
}

export interface PipelineStackProps extends StackProps {
  connection: ConnectionOptions;
  domainName: string;
  cspReportUri?: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const connectionArn = StringParameter.fromStringParameterName(
      this,
      "ConnectionArn",
      props.connection.parameterName
    ).stringValue;

    const source = pipelines.CodePipelineSource.connection(props.connection.repoName, props.connection.branch, {
      connectionArn,
    });

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      synth: new pipelines.ShellStep("Synth", {
        input: source,
        commands: ["cd cdk", "npm ci", "npm run build", "cd ..", "bundler exec jekyll build", "npx cdk synth"],
      }),
    });
    pipeline.addStage(
      new SiteStage(this, "SiteStage", {
        domainName: props.domainName,
        cspReportUri: props.cspReportUri,
        hostedZone: HostedZone.fromLookup(this, "HostedZone", { domainName: props.domainName }),
      })
    );
  }
}
