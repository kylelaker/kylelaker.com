import * as cdk from '@aws-cdk/core';
import { StaticSite } from './static-site';

class StaticSiteStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props);

    new StaticSite(this, 'StaticSite', {
      domainName: this.node.tryGetContext('domain'),
      distributionLogicalId: this.node.tryGetContext('distributionLogicalId'),
    });
  }
}

const app = new cdk.App();

new StaticSiteStack(app, 'BuildStaticSite', {
  env: {
    account: app.node.tryGetContext('accountId'),
    region: 'us-east-1',
  },
});

app.synth();
