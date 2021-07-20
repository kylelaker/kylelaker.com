import * as cdk from '@aws-cdk/core';
import * as route53 from '@aws-cdk/aws-route53';
import * as s3 from '@aws-cdk/aws-s3';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import { Construct, RemovalPolicy, Stack } from '@aws-cdk/core';

export interface StaticSiteProps {
    domainName: string;
    distributionLogicalId?: string;
}

function aliasResourceName(alias: string): string {
  const name = alias.replace(/\.([a-z])/g, (_match: string, p1: string): string => p1.toUpperCase());
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */
export class StaticSite extends Construct {
  constructor(parent: Stack, name: string, props: StaticSiteProps) {
    super(parent, name);

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });
    const siteDomain = props.domainName;
    const aliases = [`www.${siteDomain}`];
    new cdk.CfnOutput(this, 'Site', { value: `https://${siteDomain}` });

    // Content bucket
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: siteDomain,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    new cdk.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    // TLS certificate
    const acmCertificate = new acm.DnsValidatedCertificate(this, 'TlsCertificate', {
      domainName: siteDomain,
      subjectAlternativeNames: aliases,
      hostedZone: zone,
      region: 'us-east-1', // Cloudfront only checks this region for certificates.
    });
    new cdk.CfnOutput(this, 'Certificate', { value: acmCertificate.certificateArn });

    const rewriteFunction = new cloudfront.Function(this, 'RewriteFunction', {
      code: cloudfront.FunctionCode.fromFile({ filePath: 'rewrite-request.js' }),
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: rewriteFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: '/404.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
        },
      ],
      defaultRootObject: 'index.html',
      domainNames: [siteDomain, ...aliases],
      certificate: acmCertificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });
    // This is going to need to be a wonky bit of code that exists, possibly forever,
    // (where forever is defined as "time until I can delete & rebuild the stack")
    // as the switch to cloudfront.Distribution from cloudfront.CloudFrontDistribution
    // results in a changed logical ID (which of course results in resource replacement).
    // Since creation happens before deletion during replacement and the same domain names
    // are being used (and CloudFormation gets really grumpy about that), there isn't a
    // particularly clean way to walk this over without just carrying forward the old logical ID.
    // Unfortunately, not only is this ugly but it makes some other resource logical IDs
    // ugly as well.
    if (props.distributionLogicalId) {
      const cfnDistribution = distribution.node.defaultChild as cloudfront.CfnDistribution;
      cfnDistribution.overrideLogicalId(props.distributionLogicalId);
    }
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

    // DNS records (for the base domain and aliases)
    const recordTarget = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution));
    [siteDomain, ...aliases].forEach((alias) => {
      const aliasResourceSuffix = aliasResourceName(alias);
      const aliasv4 = new route53.ARecord(this, `AliasRecord${aliasResourceSuffix}`, {
        recordName: alias,
        target: recordTarget,
        zone,
      });
      const aliasv6 = new route53.AaaaRecord(this, `AaaaliasRecord${aliasResourceSuffix}`, {
        recordName: alias,
        target: recordTarget,
        zone,
      });
      // From time to time, there may be some need to update the Route 53 record sets for
      // A and AAAA. Unfortunately, the replacement usually seems to end up needing some
      // help with deleting the existing records manually while CloudFormation is creating
      // the new ones. Then at the end, without forcing the retain, it just goes and deletes
      // the same records it just created.
      const aliasv4Cfn = aliasv4.node.defaultChild as route53.CfnRecordSet;
      aliasv4Cfn.applyRemovalPolicy(RemovalPolicy.RETAIN);
      const aliasv6Cfn = aliasv6.node.defaultChild as route53.CfnRecordSet;
      aliasv6Cfn.applyRemovalPolicy(RemovalPolicy.RETAIN);
    });
  }
}
