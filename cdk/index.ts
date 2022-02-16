import { App, Stack, StackProps, aws_iam as iam } from "aws-cdk-lib";
import { ContentSecurityPolicy, CspValue } from "./content-security-policy";
import { StaticSite } from "./static-site";

interface StaticSiteProps extends StackProps {
  repoName: string;
}

class StaticSiteStack extends Stack {
  constructor(parent: App, name: string, props: StaticSiteProps) {
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
      reportUri: this.node.tryGetContext("ReportUri"),
      upgradeInsecureRequests: true,
      blockAllMixedContent: true,
    });

    const site = new StaticSite(this, "StaticSite", {
      domainName: this.node.tryGetContext("DomainName"),
      distributionLogicalId: this.node.tryGetContext("DistributionLogicalId"),
      contentSecurityPolicy: csp,
    });

    const githubProvider = new iam.OpenIdConnectProvider(this, "GithubOidcKylelakerCom", {
      url: "https://token.actions.githubusercontent.com",
      thumbprints: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
      clientIds: ["sts.amazonaws.com"],
    });
    const githubRole = new iam.Role(this, "GitHubOidcDeploy", {
      roleName: "GitHubKyleLakerComDeploy",
      description: "Allows deploying to the site's S3 bucket from GitHub Actions",
      assumedBy: new iam.OpenIdConnectPrincipal(githubProvider).withConditions({
        StringLike: {
          // Allow deployments only from the main branch of the repository
          "token.actions.githubusercontent.com:sub": `repo:${props.repoName}:ref:refs/heads/main`,
        },
      }),
    });
    const s3DepoyPolicy = new iam.Policy(this, "GitHubActionsDeployPolicy", {
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: "S3CliSync",
            effect: iam.Effect.ALLOW,
            actions: ["s3:PutObject", "s3:ListBucket", "s3:DeleteObject", "s3:GetObject"],
            resources: [site.siteBucket.bucketArn, site.siteBucket.arnForObjects("*")],
          }),
        ],
      }),
    });
    s3DepoyPolicy.attachToRole(githubRole);
  }
}

const app = new App();

new StaticSiteStack(app, "BuildStaticSite", {
  repoName: "kylelaker/kylelaker.com",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
