"""Unit tests for the leave service using an isolated DynamoDB table."""

import importlib
import sys

import boto3
import pytest
from boto3.dynamodb.conditions import Key
from moto import mock_aws


@pytest.fixture
def leave_service(monkeypatch):
    """Create the mocked PK/SK table before importing the service module."""
    table_name = "leave-test"
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
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        table.wait_until_exists()

        module_name = "api.services.leave_service"
        sys.modules.pop(module_name, None)
        service = importlib.import_module(module_name)
        try:
            yield service, table
        finally:
            sys.modules.pop(module_name, None)


def test_save_writes_employee_and_date_keys_and_defaults_note(leave_service):
    # Arrange
    service, table = leave_service
    employee_id = "employee-123"
    start_date = "2026-07-10"
    data = {"endDate": "2026-07-12"}
    expected = {
        "PK": employee_id,
        "SK": start_date,
        "employeeId": employee_id,
        "startDate": start_date,
        "endDate": "2026-07-12",
        "note": "",
    }

    # Act
    item = service.save(employee_id, start_date, data)

    # Assert
    assert item == expected
    assert table.get_item(Key={"PK": employee_id, "SK": start_date})["Item"] == expected


def test_save_with_same_employee_and_date_overwrites_existing_leave(leave_service):
    # Arrange
    service, table = leave_service
    employee_id = "employee-123"
    start_date = "2026-07-10"
    service.save(employee_id, start_date, {"endDate": "2026-07-11", "note": "First"})

    # Act
    updated_item = service.save(
        employee_id, start_date, {"endDate": "2026-07-12", "note": "Updated"}
    )

    # Assert
    stored_items = table.query(
        KeyConditionExpression=Key("PK").eq(employee_id)
    )["Items"]
    assert stored_items == [updated_item]
    assert updated_item["endDate"] == "2026-07-12"
    assert updated_item["note"] == "Updated"


def test_list_for_employee_without_month_returns_all_items_sorted_by_start_date(
    leave_service,
):
    # Arrange
    service, _ = leave_service
    employee_id = "employee-123"
    service.save(employee_id, "2026-09-01", {"endDate": "2026-09-02"})
    service.save(employee_id, "2026-07-15", {"endDate": "2026-07-16"})
    service.save(employee_id, "2026-08-01", {"endDate": "2026-08-02"})
    service.save("employee-456", "2026-07-01", {"endDate": "2026-07-02"})

    # Act
    items = service.list_for_employee(employee_id, None)

    # Assert
    assert [item["SK"] for item in items] == [
        "2026-07-15",
        "2026-08-01",
        "2026-09-01",
    ]


def test_list_for_employee_month_returns_only_matching_start_dates(leave_service):
    # Arrange
    service, _ = leave_service
    employee_id = "employee-123"
    service.save(employee_id, "2026-07-01", {"endDate": "2026-07-02"})
    service.save(employee_id, "2026-07-20", {"endDate": "2026-07-21"})
    service.save(employee_id, "2026-08-01", {"endDate": "2026-08-02"})

    # Act
    items = service.list_for_employee(employee_id, "2026-07")

    # Assert
    assert [item["SK"] for item in items] == ["2026-07-01", "2026-07-20"]


def test_list_for_employee_with_no_leave_returns_empty_list(leave_service):
    # Arrange
    service, _ = leave_service

    # Act
    items = service.list_for_employee("employee-without-leave", None)

    # Assert
    assert items == []
