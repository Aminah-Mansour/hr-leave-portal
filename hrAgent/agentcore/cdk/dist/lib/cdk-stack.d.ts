import { AgentCoreApplication, type AgentCoreApplicationProps } from '@aws/agentcore-cdk';
import { Stack, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface AgentCoreStackProps extends StackProps {
    /** Props for the AgentCore application, produced by transformAgentCoreJson from agentcore/agentcore.json. */
    application: AgentCoreApplicationProps;
}
/**
 * The stack the AgentCore CLI deploys. Everything declared in agentcore/agentcore.json is
 * created by the AgentCoreApplication construct. Add your own resources below it and wire
 * them to your runtimes and harnesses through the application's accessors.
 */
export declare class AgentCoreStack extends Stack {
    readonly application: AgentCoreApplication;
    constructor(scope: Construct, id: string, props: AgentCoreStackProps);
}
