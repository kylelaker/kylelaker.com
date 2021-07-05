import * as cdk from '@aws-cdk/core';
import * as route53 from '@aws-cdk/aws-route53';
import * as s3 from '@aws-cdk/aws-s3';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as iam from '@aws-cdk/aws-iam';
import { Construct, Stack } from '@aws-cdk/core';

export interface StaticSiteProps {
    domainName: string;
}

function aliasResourceName(alias: string): string {
  return alias.replace(/\.([a-z])/g, (_match: string, p1: string): string => p1.toUpperCase());
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
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'cloudfront-OAI', {
      comment: `OAI for ${name}`,
    });

    new cdk.CfnOutput(this, 'Site', { value: `https://${siteDomain}` });

    // Content bucket
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: siteDomain,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    // Grant access to cloudfront
    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [siteBucket.arnForObjects('*')],
      principals: [
        new iam.CanonicalUserPrincipal(
          cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId,
        ),
      ],
    }));
    new cdk.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    // TLS certificate
    const { certificateArn } = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: siteDomain,
      hostedZone: zone,
      subjectAlternativeNames: aliases,
      region: 'us-east-1', // Cloudfront only checks this region for certificates.
    });
    new cdk.CfnOutput(this, 'Certificate', { value: certificateArn });

    // Specifies you want viewers to use HTTPS & TLS v1.2+ to request your objects
    const viewerCertificate = cloudfront.ViewerCertificate.fromAcmCertificate({
      certificateArn,
      env: {
        region: cdk.Aws.REGION,
        account: cdk.Aws.ACCOUNT_ID,
      },
      node: this.node,
      stack: parent,
    },
    {
      sslMethod: cloudfront.SSLMethod.SNI,
      securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
      aliases: [siteDomain, ...aliases],
    });

    // CloudFront distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      viewerCertificate,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
            originAccessIdentity: cloudfrontOAI,
          },
          behaviors: [{
            isDefaultBehavior: true,
            compress: true,
            allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
          }],
        },
      ],
    });
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

    const recordTarget = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution));
    [siteDomain, ...aliases].forEach((alias) => {
      const aliasResourceSuffix = aliasResourceName(alias);
      new route53.ARecord(this, `AliasRecord${aliasResourceSuffix}`, {
        recordName: alias,
        target: recordTarget,
        zone,
      });
      new route53.AaaaRecord(this, `AaaaliasRecord${aliasResourceSuffix}`, {
        recordName: alias,
        target: recordTarget,
        zone,
      });
    });
  }
}
