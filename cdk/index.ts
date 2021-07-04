import * as cdk from '@aws-cdk/core';
import { StaticSite } from './static-site';

/*
 * This code largely comes from:
 * https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/static-site
 * 
 * It is a goal to clean this up and customize it a bit more in the future.
 */

class StaticSiteStack extends cdk.Stack {
    constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props);

        new StaticSite(this, 'StaticSite', {
            domainName: this.node.tryGetContext('domain'),
        });
    }
}

const app = new cdk.App();

new StaticSiteStack(app, 'BuildStaticSite', {
    env: {
        account: app.node.tryGetContext('accountId'),
        region: 'us-east-1',
    }
});

app.synth();
