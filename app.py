#!/usr/bin/env python3
import os

import aws_cdk as cdk
import boto3
from hr_leave_portal.agent_runtime_stack import AgentRuntimeStack
from hr_leave_portal.backend_stack import BackendStack
from hr_leave_portal.notification_stack import NotificationStack
from hr_leave_portal.state_machine_stack import StateMachineStack
from hr_leave_portal.ui_stack import UiStack

app = cdk.App()


def deployed_stack_outputs(stack_name: str) -> dict[str, str]:
    """Read published values from an already-deployed stack.

    The UI stack must not introduce weak cross-stack references: its existing
    backend/runtime stacks predate CDK's generated PublishOutput aliases and
    are intentionally excluded from UI-only deployments.
    """
    session = boto3.Session()
    region = (
        os.environ.get("CDK_DEFAULT_REGION")
        or os.environ.get("AWS_REGION")
        or os.environ.get("AWS_DEFAULT_REGION")
        or session.region_name
        or "us-east-1"
    )
    client = session.client("cloudformation", region_name=region)
    response = client.describe_stacks(StackName=stack_name)
    stacks = response.get("Stacks", [])
    if not stacks:
        raise RuntimeError(f"Required deployed stack {stack_name} was not found")
    return {
        output["OutputKey"]: output["OutputValue"]
        for output in stacks[0].get("Outputs", [])
        if "OutputKey" in output and "OutputValue" in output
    }


backend_outputs = deployed_stack_outputs("HrLeavePortalBackend")
agent_runtime_outputs = deployed_stack_outputs("HrLeavePortalAgentRuntime")
required_backend_outputs = ("ApiUrl", "UserPoolId", "UserPoolClientId")
missing_backend_outputs = [
    key for key in required_backend_outputs if key not in backend_outputs
]
if missing_backend_outputs:
    raise RuntimeError(
        "HrLeavePortalBackend is missing required outputs: "
        + ", ".join(missing_backend_outputs)
    )
if "AgentRuntimeArn" not in agent_runtime_outputs:
    raise RuntimeError("HrLeavePortalAgentRuntime is missing AgentRuntimeArn")

aws_region = (
    os.environ.get("CDK_DEFAULT_REGION")
    or os.environ.get("AWS_REGION")
    or os.environ.get("AWS_DEFAULT_REGION")
    or boto3.Session().region_name
    or "us-east-1"
)

notifications = NotificationStack(app, "HrLeavePortalNotifications")

backend = BackendStack(
    app,
    "HrLeavePortalBackend",
    ui_origin="https://d13a73sfknfq9f.cloudfront.net",
)

StateMachineStack(
    app,
    "HrLeavePortalStateMachine",
    hr_email_topic=notifications.hr_email_topic,
    api_function=backend.api_function
)

agent_runtime = AgentRuntimeStack(
    app,
    "HrLeavePortalAgentRuntime",
    table=backend.table,
    hr_email_topic=notifications.hr_email_topic,
    user_pool=backend.user_pool,
    user_pool_client=backend.user_pool_client
)

ui_stack = UiStack(
    app,
    "HrLeavePortalUi",
    api_url=backend_outputs["ApiUrl"],
    user_pool_id=backend_outputs["UserPoolId"],
    user_pool_client_id=backend_outputs["UserPoolClientId"],
    agent_runtime_url=f"https://bedrock-agentcore.{aws_region}.amazonaws.com",
    agent_runtime_arn=agent_runtime_outputs["AgentRuntimeArn"],
)

app.synth()
