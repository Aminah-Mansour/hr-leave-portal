#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_cdk_lib_1 = require("aws-cdk-lib");
const agentcore_cdk_1 = require("@aws/agentcore-cdk");
const cdk_stack_1 = require("../lib/cdk-stack");
try {
    // The AgentCore CLI runs this app from agentcore/cdk/; readAgentCoreProject walks up to agentcore/.
    const project = (0, agentcore_cdk_1.readAgentCoreProject)();
    const app = new aws_cdk_lib_1.App();
    for (const stack of (0, agentcore_cdk_1.resolveTargetStacks)({
        projectName: project.projectName,
        targets: project.targets,
        deployedState: project.deployedState,
    })) {
        new cdk_stack_1.AgentCoreStack(app, stack.stackName, {
            env: stack.env,
            tags: stack.tags,
            description: stack.description,
            application: (0, agentcore_cdk_1.transformAgentCoreJson)(project.agentCoreJson, {
                projectRoot: project.projectRoot,
                credentials: stack.credentials,
                target: stack.target,
            }),
        });
    }
    app.synth();
}
catch (error) {
    console.error('AgentCore CDK synthesis failed:', error instanceof Error ? error.message : error);
    process.exit(1);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vYmluL2Nkay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw2Q0FBa0M7QUFDbEMsc0RBQXVHO0FBQ3ZHLGdEQUFrRDtBQUVsRCxJQUFJLENBQUM7SUFDSCxvR0FBb0c7SUFDcEcsTUFBTSxPQUFPLEdBQUcsSUFBQSxvQ0FBb0IsR0FBRSxDQUFDO0lBQ3ZDLE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQUcsRUFBRSxDQUFDO0lBQ3RCLEtBQUssTUFBTSxLQUFLLElBQUksSUFBQSxtQ0FBbUIsRUFBQztRQUN0QyxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7UUFDaEMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO1FBQ3hCLGFBQWEsRUFBRSxPQUFPLENBQUMsYUFBYTtLQUNyQyxDQUFDLEVBQUUsQ0FBQztRQUNILElBQUksMEJBQWMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRTtZQUN2QyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUc7WUFDZCxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7WUFDaEIsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXO1lBQzlCLFdBQVcsRUFBRSxJQUFBLHNDQUFzQixFQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7Z0JBQ3pELFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztnQkFDaEMsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXO2dCQUM5QixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07YUFDckIsQ0FBQztTQUNILENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDZCxDQUFDO0FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztJQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0IHsgQXBwIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgcmVhZEFnZW50Q29yZVByb2plY3QsIHJlc29sdmVUYXJnZXRTdGFja3MsIHRyYW5zZm9ybUFnZW50Q29yZUpzb24gfSBmcm9tICdAYXdzL2FnZW50Y29yZS1jZGsnO1xuaW1wb3J0IHsgQWdlbnRDb3JlU3RhY2sgfSBmcm9tICcuLi9saWIvY2RrLXN0YWNrJztcblxudHJ5IHtcbiAgLy8gVGhlIEFnZW50Q29yZSBDTEkgcnVucyB0aGlzIGFwcCBmcm9tIGFnZW50Y29yZS9jZGsvOyByZWFkQWdlbnRDb3JlUHJvamVjdCB3YWxrcyB1cCB0byBhZ2VudGNvcmUvLlxuICBjb25zdCBwcm9qZWN0ID0gcmVhZEFnZW50Q29yZVByb2plY3QoKTtcbiAgY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuICBmb3IgKGNvbnN0IHN0YWNrIG9mIHJlc29sdmVUYXJnZXRTdGFja3Moe1xuICAgIHByb2plY3ROYW1lOiBwcm9qZWN0LnByb2plY3ROYW1lLFxuICAgIHRhcmdldHM6IHByb2plY3QudGFyZ2V0cyxcbiAgICBkZXBsb3llZFN0YXRlOiBwcm9qZWN0LmRlcGxveWVkU3RhdGUsXG4gIH0pKSB7XG4gICAgbmV3IEFnZW50Q29yZVN0YWNrKGFwcCwgc3RhY2suc3RhY2tOYW1lLCB7XG4gICAgICBlbnY6IHN0YWNrLmVudixcbiAgICAgIHRhZ3M6IHN0YWNrLnRhZ3MsXG4gICAgICBkZXNjcmlwdGlvbjogc3RhY2suZGVzY3JpcHRpb24sXG4gICAgICBhcHBsaWNhdGlvbjogdHJhbnNmb3JtQWdlbnRDb3JlSnNvbihwcm9qZWN0LmFnZW50Q29yZUpzb24sIHtcbiAgICAgICAgcHJvamVjdFJvb3Q6IHByb2plY3QucHJvamVjdFJvb3QsXG4gICAgICAgIGNyZWRlbnRpYWxzOiBzdGFjay5jcmVkZW50aWFscyxcbiAgICAgICAgdGFyZ2V0OiBzdGFjay50YXJnZXQsXG4gICAgICB9KSxcbiAgICB9KTtcbiAgfVxuICBhcHAuc3ludGgoKTtcbn0gY2F0Y2ggKGVycm9yKSB7XG4gIGNvbnNvbGUuZXJyb3IoJ0FnZW50Q29yZSBDREsgc3ludGhlc2lzIGZhaWxlZDonLCBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yKTtcbiAgcHJvY2Vzcy5leGl0KDEpO1xufVxuIl19