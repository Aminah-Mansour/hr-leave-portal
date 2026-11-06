"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCoreStack = void 0;
const agentcore_cdk_1 = require("@aws/agentcore-cdk");
const aws_cdk_lib_1 = require("aws-cdk-lib");
/**
 * The stack the AgentCore CLI deploys. Everything declared in agentcore/agentcore.json is
 * created by the AgentCoreApplication construct. Add your own resources below it and wire
 * them to your runtimes and harnesses through the application's accessors.
 */
class AgentCoreStack extends aws_cdk_lib_1.Stack {
    application;
    constructor(scope, id, props) {
        super(scope, id, props);
        this.application = new agentcore_cdk_1.AgentCoreApplication(this, 'Application', props.application);
        // Example: give a runtime a DynamoDB table.
        //
        // import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
        // const orders = new dynamodb.Table(this, 'Orders', {
        //   partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
        // });
        // const checkout = this.application.runtime('checkout'); // or .harness('support')
        // checkout.grantReadWrite(orders);
        // checkout.addEnvironmentVariable('ORDERS_TABLE', orders.tableName);
    }
}
exports.AgentCoreStack = AgentCoreStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2Nkay1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxzREFBMEY7QUFDMUYsNkNBQXFEO0FBUXJEOzs7O0dBSUc7QUFDSCxNQUFhLGNBQWUsU0FBUSxtQkFBSztJQUN2QixXQUFXLENBQXVCO0lBRWxELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBMEI7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLG9DQUFvQixDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXBGLDRDQUE0QztRQUM1QyxFQUFFO1FBQ0Ysd0RBQXdEO1FBQ3hELHNEQUFzRDtRQUN0RCx1RUFBdUU7UUFDdkUsTUFBTTtRQUNOLG1GQUFtRjtRQUNuRixtQ0FBbUM7UUFDbkMscUVBQXFFO0lBQ3ZFLENBQUM7Q0FDRjtBQWpCRCx3Q0FpQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZ2VudENvcmVBcHBsaWNhdGlvbiwgdHlwZSBBZ2VudENvcmVBcHBsaWNhdGlvblByb3BzIH0gZnJvbSAnQGF3cy9hZ2VudGNvcmUtY2RrJztcbmltcG9ydCB7IFN0YWNrLCB0eXBlIFN0YWNrUHJvcHMgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBBZ2VudENvcmVTdGFja1Byb3BzIGV4dGVuZHMgU3RhY2tQcm9wcyB7XG4gIC8qKiBQcm9wcyBmb3IgdGhlIEFnZW50Q29yZSBhcHBsaWNhdGlvbiwgcHJvZHVjZWQgYnkgdHJhbnNmb3JtQWdlbnRDb3JlSnNvbiBmcm9tIGFnZW50Y29yZS9hZ2VudGNvcmUuanNvbi4gKi9cbiAgYXBwbGljYXRpb246IEFnZW50Q29yZUFwcGxpY2F0aW9uUHJvcHM7XG59XG5cbi8qKlxuICogVGhlIHN0YWNrIHRoZSBBZ2VudENvcmUgQ0xJIGRlcGxveXMuIEV2ZXJ5dGhpbmcgZGVjbGFyZWQgaW4gYWdlbnRjb3JlL2FnZW50Y29yZS5qc29uIGlzXG4gKiBjcmVhdGVkIGJ5IHRoZSBBZ2VudENvcmVBcHBsaWNhdGlvbiBjb25zdHJ1Y3QuIEFkZCB5b3VyIG93biByZXNvdXJjZXMgYmVsb3cgaXQgYW5kIHdpcmVcbiAqIHRoZW0gdG8geW91ciBydW50aW1lcyBhbmQgaGFybmVzc2VzIHRocm91Z2ggdGhlIGFwcGxpY2F0aW9uJ3MgYWNjZXNzb3JzLlxuICovXG5leHBvcnQgY2xhc3MgQWdlbnRDb3JlU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBhcHBsaWNhdGlvbjogQWdlbnRDb3JlQXBwbGljYXRpb247XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFnZW50Q29yZVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcbiAgICB0aGlzLmFwcGxpY2F0aW9uID0gbmV3IEFnZW50Q29yZUFwcGxpY2F0aW9uKHRoaXMsICdBcHBsaWNhdGlvbicsIHByb3BzLmFwcGxpY2F0aW9uKTtcblxuICAgIC8vIEV4YW1wbGU6IGdpdmUgYSBydW50aW1lIGEgRHluYW1vREIgdGFibGUuXG4gICAgLy9cbiAgICAvLyBpbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuICAgIC8vIGNvbnN0IG9yZGVycyA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnT3JkZXJzJywge1xuICAgIC8vICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwaycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgLy8gfSk7XG4gICAgLy8gY29uc3QgY2hlY2tvdXQgPSB0aGlzLmFwcGxpY2F0aW9uLnJ1bnRpbWUoJ2NoZWNrb3V0Jyk7IC8vIG9yIC5oYXJuZXNzKCdzdXBwb3J0JylcbiAgICAvLyBjaGVja291dC5ncmFudFJlYWRXcml0ZShvcmRlcnMpO1xuICAgIC8vIGNoZWNrb3V0LmFkZEVudmlyb25tZW50VmFyaWFibGUoJ09SREVSU19UQUJMRScsIG9yZGVycy50YWJsZU5hbWUpO1xuICB9XG59XG4iXX0=