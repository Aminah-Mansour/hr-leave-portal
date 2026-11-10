"""Unit tests for the employee service using an isolated DynamoDB table."""

import importlib
import sys

import boto3
import pytest
from moto import mock_aws


@pytest.fixture
def employee_service(monkeypatch):
    """Create the mocked table before importing the service module."""
    table_name = "employees-test"
    monkeypatch.setenv("TABLE_NAME", table_name)

    with mock_aws():
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
                {"AttributeName": "startDate", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
            LocalSecondaryIndexes=[
                {
                    "IndexName": "ByStartDate",
                    "KeySchema": [
                        {"AttributeName": "PK", "KeyType": "HASH"},
                        {"AttributeName": "startDate", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
        )
        table.wait_until_exists()

        module_name = "api.services.employee_service"
        sys.modules.pop(module_name, None)
        service = importlib.import_module(module_name)
        try:
            yield service, table
        finally:
            sys.modules.pop(module_name, None)


def test_create_generates_eight_character_id_and_persists_employee(employee_service):
    # Arrange
    service, table = employee_service
    data = {
        "name": "Amina Hassan",
        "department": "People",
        "startDate": "2024-01-15",
    }

    # Act
    item = service.create(data)

    # Assert
    assert len(item["employeeId"]) == 8
    assert item["PK"] == "USER"
    assert item["SK"] == item["employeeId"]
    assert table.get_item(Key={"PK": "USER", "SK": item["SK"]})["Item"] == item


def test_create_twice_generates_different_employee_ids(employee_service):
    # Arrange
    service, _ = employee_service
    data = {
        "name": "Amina Hassan",
        "department": "People",
        "startDate": "2024-01-15",
    }

    # Act
    first = service.create(data)
    second = service.create(data)

    # Assert
    assert first["employeeId"] != second["employeeId"]


def test_save_writes_expected_employee_item(employee_service):
    # Arrange
    service, table = employee_service
    employee_id = "a1b2c3d4"
    data = {
        "name": "Amina Hassan",
        "department": "People",
        "startDate": "2024-01-15",
        "role": "manager",
    }

    # Act
    item = service.save(employee_id, data)

    # Assert
    expected = {
        "PK": "USER",
        "SK": employee_id,
        "GSI1PK": "USER_BY_DATE",
        "GSI1SK": "2024-01-15",
        "employeeId": employee_id,
        "name": "Amina Hassan",
        "department": "People",
        "startDate": "2024-01-15",
        "role": "manager",
    }
    assert item == expected
    assert table.get_item(Key={"PK": "USER", "SK": employee_id})["Item"] == expected


def test_save_defaults_role_to_employee_when_omitted(employee_service):
    # Arrange
    service, table = employee_service
    employee_id = "e5f6g7h8"
    data = {
        "name": "Sam Lee",
        "department": "Finance",
        "startDate": "2023-06-01",
    }

    # Act
    item = service.save(employee_id, data)

    # Assert
    assert item["role"] == "employee"
    assert table.get_item(Key={"PK": "USER", "SK": employee_id})["Item"] == item
