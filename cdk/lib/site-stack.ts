import { Stack, StackProps } from "aws-cdk-lib";
import { IHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

import { ContentSecurityPolicy, CspValue } from "./content-security-policy";
import { StaticSite } from "./static-site";

export interface StaticSiteStackProps extends StackProps {
  domainName: string;
  hostedZone: IHostedZone;
  cspReportUri?: string;
}

export class StaticSiteStack extends Stack {
  constructor(parent: Construct, name: string, props: StaticSiteStackProps) {
    super(parent, name, props);

    const jsdelivr = CspValue.host("https://cdn.jsdelivr.net");
    const fontawesome = CspValue.host("https://*.fontawesome.com");

    const csp = new ContentSecurityPolicy({
      defaultSrc: [CspValue.NONE],
      scriptSrc: [CspValue.SELF, CspValue.UNSAFE_INLINE, jsdelivr, fontawesome],
      styleSrc: [CspValue.SELF, CspValue.UNSAFE_INLINE, jsdelivr, fontawesome],
      imgSrc: [CspValue.SELF, CspValue.DATA, fontawesome],
      fontSrc: [fontawesome],
      connectSrc: [CspValue.SELF, fontawesome],
      reportUri: props.cspReportUri,
      upgradeInsecureRequests: true,
      blockAllMixedContent: true,
    });

    // eslint-disable-next-line no-new
    new StaticSite(this, "StaticSite", {
      domainName: props.domainName,
      contentSecurityPolicy: csp,
      hostedZone: props.hostedZone,
    });
  }
}
