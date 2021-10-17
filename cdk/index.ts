import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import { StaticSite } from "./static-site";

interface StaticSiteProps extends cdk.StackProps {
  repoName: string;
}

class StaticSiteStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: StaticSiteProps) {
    super(parent, name, props);

    const site = new StaticSite(this, "StaticSite", {
      domainName: this.node.tryGetContext("domain"),
      distributionLogicalId: this.node.tryGetContext("distributionLogicalId"),
    });

    const githubProvider = new iam.OpenIdConnectProvider(this, "GithubOidcKylelakerCom", {
      url: "https://token.actions.githubusercontent.com",
      thumbprints: ["a031c46782e6e6c662c2c87c76da9aa62ccabd8e"],
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
            sid: "S3ReadWrite",
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

const app = new cdk.App();

new StaticSiteStack(app, "BuildStaticSite", {
  repoName: "kylelaker/kylelaker.com",
  env: {
    account: app.node.tryGetContext("accountId"),
    region: "us-east-1",
  },
});

app.synth();
