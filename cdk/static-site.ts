import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { ContentSecurityPolicy } from "./content-security-policy";

export interface StaticSiteProps {
  domainName: string;
  contentSecurityPolicy?: ContentSecurityPolicy;
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
  public readonly domainName: string;
  public readonly siteBucket: s3.IBucket;
  public readonly distribution: cloudfront.IDistribution;

  constructor(parent: cdk.Stack, name: string, props: StaticSiteProps) {
    super(parent, name);

    const zone = route53.HostedZone.fromLookup(this, "Zone", { domainName: props.domainName });
    const siteDomain = props.domainName;
    this.domainName = siteDomain;
    const aliases = [`www.${siteDomain}`];
    new cdk.CfnOutput(this, "Site", { value: `https://${siteDomain}` });

    // Content bucket
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      bucketName: siteDomain,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    new cdk.CfnOutput(this, "Bucket", { value: siteBucket.bucketName });
    this.siteBucket = siteBucket;

    // TLS certificate
    const acmCertificate = new acm.Certificate(this, "TlsCertificate", {
      domainName: siteDomain,
      subjectAlternativeNames: aliases,
      validation: acm.CertificateValidation.fromDns(zone),
    });
    new cdk.CfnOutput(this, "Certificate", { value: acmCertificate.certificateArn });

    const viewerRequestFunction = new cloudfront.Function(this, "ViewerRequestFunction", {
      code: cloudfront.FunctionCode.fromFile({ filePath: "cf-functions/build/viewer-request.js" }),
      comment: "Handles URL rewrites",
    });

    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, "ResponseHeadersPolicy", {
      securityHeadersBehavior: {
        ...(props.contentSecurityPolicy
          ? {
              contentSecurityPolicy: {
                contentSecurityPolicy: props.contentSecurityPolicy.value,
                override: true,
              },
            }
          : {}),
        contentTypeOptions: {
          override: true,
        },
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true,
        },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.days(730),
          includeSubdomains: true,
          preload: true,
          override: true,
        },
        xssProtection: {
          modeBlock: true,
          protection: true,
          override: true,
        },
      },
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy,
        functionAssociations: [
          {
            function: viewerRequestFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: "/404.html",
        },
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
        },
      ],
      defaultRootObject: "index.html",
      domainNames: [siteDomain, ...aliases],
      certificate: acmCertificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });
    new cdk.CfnOutput(this, "DistributionId", { value: distribution.distributionId });
    this.distribution = distribution;

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
      aliasv4.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
      aliasv6.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
    });
  }
}
