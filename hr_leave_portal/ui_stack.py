from aws_cdk import (
    CfnOutput,
    Duration,
    Fn,
    RemovalPolicy,
    Stack,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_s3 as s3,
    aws_s3_deployment as s3deploy,
    aws_ssm as ssm,
)
from constructs import Construct

from hr_leave_portal.backend_stack import UI_ORIGIN_PARAMETER


class UiStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        api_url: str,
        user_pool_id: str,
        user_pool_client_id: str,
        agent_runtime_url: str,
        agent_runtime_arn: str,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        website_bucket = s3.Bucket(
            self,
            "UiBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.RETAIN,
        )

        runtime_config_code = Fn.join(
            "",
            [
                """function handler(event) {
  if (event.request.uri !== '/config.js') return event.request;
  return {
    statusCode: 200,
    statusDescription: 'OK',
    headers: {
      'content-type': { value: 'application/javascript; charset=utf-8' },
      'cache-control': { value: 'no-store, max-age=0' }
    },
    body: 'window.__HR_LEAVE_PORTAL_CONFIG__ = ' + JSON.stringify({
      apiUrl: '""",
                api_url,
                """',
      userPoolId: '""",
                user_pool_id,
                """',
      userPoolClientId: '""",
                user_pool_client_id,
                """',
      agentRuntimeUrl: '""",
                agent_runtime_url,
                """',
      agentRuntimeArn: '""",
                agent_runtime_arn,
                """',
      region: '""",
                self.region,
                """'
    }) + ';'
  };
}""",
            ],
        )
        runtime_config_function = cloudfront.Function(
            self,
            "RuntimeConfigFunction",
            code=cloudfront.FunctionCode.from_inline(runtime_config_code),
            runtime=cloudfront.FunctionRuntime.JS_2_0,
            comment="Provides deployment-time stack outputs to the UI at startup.",
        )

        distribution = cloudfront.Distribution(
            self,
            "UiDistribution",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(website_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                compress=True,
                response_headers_policy=cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
                function_associations=[
                    cloudfront.FunctionAssociation(
                        event_type=cloudfront.FunctionEventType.VIEWER_REQUEST,
                        function=runtime_config_function,
                    )
                ],
            ),
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.minutes(5),
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.minutes(5),
                ),
            ],
        )

        s3deploy.BucketDeployment(
            self,
            "DeployUiAssets",
            sources=[s3deploy.Source.asset("ui/dist")],
            destination_bucket=website_bucket,
            distribution=distribution,
            distribution_paths=["/*"],
        )

        ssm.StringParameter(
            self,
            "UiOriginParameter",
            parameter_name=UI_ORIGIN_PARAMETER,
            string_value=Fn.join("", ["https://", distribution.distribution_domain_name]),
            description="Allowed browser origin for the HR Leave Portal API.",
        )

        CfnOutput(self, "UiUrl", value=distribution.distribution_domain_name)
        CfnOutput(self, "UiBucketName", value=website_bucket.bucket_name)
