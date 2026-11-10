import aws_cdk as core
import aws_cdk.assertions as assertions

from hr_leave_portal.backend_stack import BackendStack


def _backend_template():
    app = core.App()
    stack = BackendStack(app, "HrLeavePortalBackend")
    return assertions.Template.from_stack(stack)


def test_dynamodb_table_has_pk_sk_and_gsi1():
    template = _backend_template()

    template.has_resource_properties(
        "AWS::DynamoDB::Table",
        {
            "BillingMode": "PAY_PER_REQUEST",
            "KeySchema": [
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            "GlobalSecondaryIndexes": assertions.Match.array_with(
                [
                    assertions.Match.object_like(
                        {
                            "IndexName": "GSI1",
                            "KeySchema": [
                                {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                                {"AttributeName": "GSI1SK", "KeyType": "RANGE"},
                            ],
                        }
                    )
                ]
            ),
        },
    )


def test_lambda_uses_configured_layer():
    # Arrange
    template = _backend_template()

    # Act / Assert
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {"Layers": assertions.Match.any_value()},
    )


def test_lambda_has_active_tracing():
    # Arrange
    template = _backend_template()

    # Act / Assert
    template.has_resource_properties(
        "AWS::Lambda::Function",
        {"TracingConfig": {"Mode": "Active"}},
    )


def test_api_gateway_methods_use_cognito_authorization():
    # Arrange
    template = _backend_template()

    # Act / Assert
    template.has_resource_properties(
        "AWS::ApiGateway::Method",
        {
            "AuthorizationType": "COGNITO_USER_POOLS",
            "AuthorizerId": assertions.Match.any_value(),
        },
    )
