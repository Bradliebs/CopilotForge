"""
error-handling.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Demonstrates robust error handling patterns for Python applications:
    custom exception hierarchy with error codes, a retry decorator with
    exponential backoff, and a request handler showing proper error propagation.

WHEN TO USE THIS:
    When your project needs structured error handling — consistent error codes,
    automatic retries for transient failures, and graceful degradation for
    non-critical operations.

HOW TO RUN:
    1. python cookbook/error-handling.py

PREREQUISITES:
    - Python 3.10+
"""

from __future__ import annotations

import asyncio
import enum
import random
from dataclasses import dataclass
from functools import wraps
from typing import Any, Awaitable, Callable, ParamSpec, TypeVar

# --- Error Codes ---


class ErrorCode(str, enum.Enum):
    """Centralized error codes. Add new codes here as your app grows."""

    VALIDATION = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    CONFLICT = "CONFLICT"
    RATE_LIMITED = "RATE_LIMITED"
    UPSTREAM_FAILURE = "UPSTREAM_FAILURE"
    INTERNAL = "INTERNAL_ERROR"
    TIMEOUT = "TIMEOUT"


# --- Custom Exception Hierarchy ---


class AppError(Exception):
    """Base application error. All custom exceptions extend this."""

    def __init__(
        self,
        message: str,
        code: ErrorCode,
        status_code: int,
        *,
        is_operational: bool = True,
        context: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.is_operational = is_operational
        self.context = context or {}

    def to_response(self) -> dict[str, Any]:
        """Serialize to a safe dict for API responses (no stack traces)."""
        error: dict[str, Any] = {
            "code": self.code.value,
            "message": str(self),
        }
        if self.context:
            error["details"] = self.context
        return {"error": error}


class ValidationError(AppError):
    """Raised when request input fails validation."""

    def __init__(self, message: str, context: dict[str, Any] | None = None) -> None:
        super().__init__(message, ErrorCode.VALIDATION, 400, context=context)


class NotFoundError(AppError):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str, resource_id: str) -> None:
        super().__init__(
            f"{resource} with id '{resource_id}' not found",
            ErrorCode.NOT_FOUND,
            404,
            context={"resource": resource, "id": resource_id},
        )


class UpstreamError(AppError):
    """Raised when an upstream service call fails."""

    def __init__(self, service: str) -> None:
        super().__init__(
            f"Upstream service '{service}' failed",
            ErrorCode.UPSTREAM_FAILURE,
            502,
            context={"service": service},
        )


class RateLimitError(AppError):
    """Raised when a request exceeds the rate limit."""

    def __init__(self, retry_after_ms: int) -> None:
        super().__init__(
            "Rate limit exceeded",
            ErrorCode.RATE_LIMITED,
            429,
            context={"retry_after_ms": retry_after_ms},
        )
        self.retry_after_ms = retry_after_ms


# --- Retry Decorator with Exponential Backoff ---

P = ParamSpec("P")
T = TypeVar("T")

RETRYABLE_CODES = {ErrorCode.UPSTREAM_FAILURE, ErrorCode.RATE_LIMITED, ErrorCode.TIMEOUT}


def should_retry_default(error: BaseException) -> bool:
    """Return True for errors that are safe to retry."""
    if isinstance(error, AppError):
        return error.code in RETRYABLE_CODES
    return False


def with_retry(
    *,
    max_attempts: int = 3,
    base_delay: float = 0.5,
    max_delay: float = 10.0,
    should_retry: Callable[[BaseException], bool] = should_retry_default,
    on_retry: Callable[[int, BaseException, float], None] | None = None,
) -> Callable[[Callable[P, Awaitable[T]]], Callable[P, Awaitable[T]]]:
    """
    Decorator that retries an async function with exponential backoff and jitter.
    Only retries errors that pass the ``should_retry`` check.
    """

    def decorator(fn: Callable[P, Awaitable[T]]) -> Callable[P, Awaitable[T]]:
        @wraps(fn)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            last_error: BaseException | None = None

            for attempt in range(1, max_attempts + 1):
                try:
                    return await fn(*args, **kwargs)
                except Exception as exc:
                    last_error = exc
                    is_last = attempt == max_attempts

                    if is_last or not should_retry(exc):
                        raise

                    exp_delay = base_delay * (2 ** (attempt - 1))
                    jitter = random.random() * base_delay
                    delay = min(exp_delay + jitter, max_delay)

                    if on_retry:
                        on_retry(attempt, exc, delay)

                    await asyncio.sleep(delay)

            raise last_error  # type: ignore[misc]

        return wrapper

    return decorator


# --- Graceful Degradation ---


async def with_fallback(
    fn: Callable[[], Awaitable[T]],
    *,
    fallback_value: T,
    on_error: Callable[[BaseException], None] | None = None,
) -> T:
    """Run *fn*; if it fails return *fallback_value* instead of raising."""
    try:
        return await fn()
    except Exception as exc:
        if on_error:
            on_error(exc)
        return fallback_value


# --- Request Handler Example ---


@dataclass
class {{resource_type}}:
    id: str
    name: str
    email: str


async def find_{{resource_type_snake}}_by_id(resource_id: str) -> {{resource_type}} | None:
    """Simulates a database lookup."""
    # TODO: Replace with actual database query for {{project_name}}.
    if resource_id == "u-123":
        return {{resource_type}}(id="u-123", name="Alice", email="alice@example.com")
    return None


@with_retry(
    max_attempts=3,
    base_delay=0.2,
    on_retry=lambda attempt, _exc, delay: print(
        f"  [retry] Attempt {attempt} failed, retrying in {delay:.0f}s..."
    ),
)
async def fetch_{{resource_type_snake}}_permissions(resource_id: str) -> list[str]:
    """Simulates an upstream API call."""
    # TODO: Replace with actual upstream call to {{api_base_url}}.
    if random.random() < 0.3:
        raise UpstreamError("{{upstream_service_name}}")
    return ["read", "write"]


async def handle_get_{{resource_type_snake}}(resource_id: str) -> dict[str, Any]:
    """
    Example request handler for {{project_name}} showing all patterns together.
    """
    if not resource_id or not isinstance(resource_id, str):
        raise ValidationError(
            "resource_id is required and must be a non-empty string",
            context={"field": "resource_id", "received": resource_id},
        )

    resource = await find_{{resource_type_snake}}_by_id(resource_id)
    if resource is None:
        raise NotFoundError("{{resource_type}}", resource_id)

    permissions = await fetch_{{resource_type_snake}}_permissions(resource.id)

    return {
        "resource": {"id": resource.id, "name": resource.name, "email": resource.email},
        "permissions": permissions,
    }


# --- Top-Level Error Handler ---


def handle_error(error: BaseException) -> dict[str, Any]:
    """Catch-all error handler. Maps to HTTP responses."""
    if isinstance(error, AppError):
        return {"status_code": error.status_code, "body": error.to_response()}

    print(f"[UNEXPECTED] {error!r}")
    generic = AppError("An unexpected error occurred", ErrorCode.INTERNAL, 500, is_operational=False)
    return {"status_code": 500, "body": generic.to_response()}


# --- Example Usage ---


async def main() -> None:
    print("=== {{project_name}} Error Handling ===\n")

    print("1. Valid lookup:")
    try:
        result = await handle_get_{{resource_type_snake}}("u-123")
        print(f"   ✅ {result['resource']['name']} — {', '.join(result['permissions'])}")
    except Exception as exc:
        resp = handle_error(exc)
        print(f"   ❌ [{resp['status_code']}] {resp['body']}")

    print("\n2. Missing resource:")
    try:
        await handle_get_{{resource_type_snake}}("u-999")
    except Exception as exc:
        resp = handle_error(exc)
        print(f"   ❌ [{resp['status_code']}] {resp['body']}")

    print("\n3. Invalid input:")
    try:
        await handle_get_{{resource_type_snake}}("")
    except Exception as exc:
        resp = handle_error(exc)
        print(f"   ❌ [{resp['status_code']}] {resp['body']}")


if __name__ == "__main__":
    asyncio.run(main())
