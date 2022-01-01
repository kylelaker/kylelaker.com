import { Stage, StageProps } from "aws-cdk-lib";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

import { StaticSiteStack } from "./site-stack";

export interface SiteStageProps extends StageProps {
  domainName: string;
  hostedZone: IHostedZone;
  cspReportUri?: string;
}

export class SiteStage extends Stage {
  constructor(scope: Construct, id: string, props: SiteStageProps) {
    super(scope, id, props);
    // eslint-disable-next-line no-new
    new StaticSiteStack(this, "StaticSite", {
      domainName: props.domainName,
      cspReportUri: props.cspReportUri,
      hostedZone: props.hostedZone,
    });
  }
}
