from fastapi import APIRouter, Depends, HTTPException
from fastapi import APIRouter, HTTPException
from datetime import date
from models import EmployeeIn
from services import employee_service
from auth import get_caller, is_admin, require_owner_or_admin

router = APIRouter(tags=["employees"])


@router.post("/employees", status_code=201)
def create_employee(payload: EmployeeIn):
    return employee_service.create(payload.model_dump(mode="json"))

@router.get("/employees/{employee_id}")
def get_employee(employee_id: str, caller: dict = Depends(get_caller)):
    employee = employee_service.get(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    require_owner_or_admin(caller, employee)
    return employee

@router.get("/employees")
def list_employees(
    hiredFrom: date | None = None,
    hiredTo: date | None = None,
    caller: dict = Depends(get_caller)):
    # Authorize BEFORE branching, or the hire-date filter skips the check.
    if not is_admin(caller):
        return {"employees": employee_service.list_for_sub(caller["sub"])}

    if hiredFrom and hiredTo:
        return {
            "employees": employee_service.list_by_hire_date(
                hiredFrom.isoformat(), hiredTo.isoformat()
            )
        }

    return {"employees": employee_service.list_all()}

@router.delete("/employees/{employee_id}")
def delete_employee(employee_id: str, caller: dict = Depends(get_caller)):
    employee = employee_service.get(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    require_owner_or_admin(caller, employee)
    employee_service.delete(employee_id)
    return {"deleted": employee_id}

@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: str,
    payload: EmployeeIn,
    caller: dict = Depends(get_caller),
):
    employee = employee_service.get(employee_id)

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    require_owner_or_admin(caller, employee)

    return employee_service.save(
        employee_id,
        payload.model_dump(mode="json")
    )