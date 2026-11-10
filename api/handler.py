import os
import time

import boto3
from botocore.exceptions import ClientError
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from controllers import employee_controller, hr_request_controller, leave_controller

app = FastAPI(title="HR Leave Portal")

_cors_origin_cache: tuple[float, str] | None = None
_CORS_CACHE_SECONDS = 30
_ssm = boto3.client("ssm")


def _cors_origin() -> str:
    """Read the deployed UI origin, using the configured fallback before UI deploy."""
    global _cors_origin_cache
    parameter_name = os.environ.get("CORS_ORIGIN_PARAMETER")
    fallback = os.environ.get("CORS_ORIGIN", "*")
    if not parameter_name:
        return fallback

    now = time.monotonic()
    if _cors_origin_cache and now - _cors_origin_cache[0] < _CORS_CACHE_SECONDS:
        return _cors_origin_cache[1]

    try:
        origin = _ssm.get_parameter(Name=parameter_name)["Parameter"]["Value"]
    except ClientError as error:
        code = error.response.get("Error", {}).get("Code")
        # The API can be deployed before the UI stack creates this parameter.
        origin = fallback if code == "ParameterNotFound" else ""
    except Exception:
        # Fail closed on transient lookup failures after the fallback period.
        origin = ""

    _cors_origin_cache = (now, origin)
    return origin


class ParameterizedCORSMiddleware:
    """Apply the current CloudFront origin without a cross-stack reference cycle."""

    def __init__(self, app, allow_methods=None, allow_headers=None):
        self.app = app
        self.allow_methods = allow_methods or ["*"]
        self.allow_headers = allow_headers or ["*"]

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        origin = _cors_origin()
        cors = CORSMiddleware(
            self.app,
            allow_origins=[origin] if origin else [],
            allow_methods=self.allow_methods,
            allow_headers=self.allow_headers,
        )
        await cors(scope, receive, send)


app.add_middleware(ParameterizedCORSMiddleware)

app.include_router(employee_controller.router)
app.include_router(leave_controller.router)
app.include_router(hr_request_controller.router)

lambda_handler = Mangum(app)
