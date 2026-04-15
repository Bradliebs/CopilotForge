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

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join() (both shown in code)
    - macOS/Linux: Forward slashes work natively
    - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
"""

from __future__ import annotations

import asyncio
import enum
import math
import random
import time
from dataclasses import dataclass, field
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

    Usage::

        @with_retry(max_attempts=3, base_delay=0.2)
        async def fetch_data() -> dict:
            ...
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

            # Unreachable, but satisfies the type checker.
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
    """
    Run *fn*; if it fails return *fallback_value* instead of raising.
    Use for non-critical operations (caching, analytics, etc.).

    Usage::

        prefs = await with_fallback(
            lambda: fetch_user_prefs(uid),
            fallback_value=DEFAULT_PREFS,
        )
    """
    try:
        return await fn()
    except Exception as exc:
        if on_error:
            on_error(exc)
        return fallback_value


# --- Request Handler Example ---


@dataclass
class User:
    id: str
    name: str
    email: str


async def find_user_by_id(user_id: str) -> User | None:
    """Simulates a database lookup."""
    # TODO: Replace with actual database query.
    if user_id == "u-123":
        return User(id="u-123", name="Alice", email="alice@example.com")
    return None


@with_retry(
    max_attempts=3,
    base_delay=0.2,
    on_retry=lambda attempt, _exc, delay: print(
        f"  [retry] Attempt {attempt} failed, retrying in {delay:.0f}s..."
    ),
)
async def fetch_user_permissions(user_id: str) -> list[str]:
    """Simulates an upstream API call with intermittent failures."""
    # TODO: Replace with actual upstream API call.
    if random.random() < 0.3:
        raise UpstreamError("permissions-service")
    return ["read", "write"]


async def handle_get_user(user_id: str) -> dict[str, Any]:
    """
    Example request handler showing all patterns working together:
    - Input validation  (raises ValidationError)
    - Resource lookup    (raises NotFoundError)
    - Upstream with retry (raises UpstreamError after retries)
    - Non-critical call with fallback (never raises)
    """
    # 1. Validate input.
    if not user_id or not isinstance(user_id, str) or len(user_id) < 1:
        raise ValidationError(
            "user_id is required and must be a non-empty string",
            context={"field": "user_id", "received": user_id},
        )

    # 2. Look up user — raise NotFoundError if missing.
    user = await find_user_by_id(user_id)
    if user is None:
        raise NotFoundError("User", user_id)

    # 3. Fetch permissions with retry.
    permissions = await fetch_user_permissions(user.id)

    return {"user": {"id": user.id, "name": user.name, "email": user.email}, "permissions": permissions}


# --- Top-Level Error Handler ---


def handle_error(error: BaseException) -> dict[str, Any]:
    """
    Catch-all error handler. In a real app this maps to HTTP responses.
    """
    if isinstance(error, AppError):
        return {"status_code": error.status_code, "body": error.to_response()}

    # Unknown error — log internally, return generic message.
    print(f"[UNEXPECTED] {error!r}")
    generic = AppError("An unexpected error occurred", ErrorCode.INTERNAL, 500, is_operational=False)
    return {"status_code": 500, "body": generic.to_response()}


# --- Example Usage ---


async def main() -> None:
    print("=== Error Handling Recipe ===\n")

    # Scenario 1: Successful request
    print("1. Valid user lookup:")
    try:
        result = await handle_get_user("u-123")
        print(f"   ✅ {result['user']['name']} — {', '.join(result['permissions'])}")
    except Exception as exc:
        resp = handle_error(exc)
        print(f"   ❌ [{resp['status_code']}] {resp['body']}")

    # Scenario 2: Not found
    print("\n2. Missing user:")
    try:
        await handle_get_user("u-999")
    except Exception as exc:
        resp = handle_error(exc)
        print(f"   ❌ [{resp['status_code']}] {resp['body']}")

    # Scenario 3: Validation error
    print("\n3. Invalid input:")
    try:
        await handle_get_user("")
    except Exception as exc:
        resp = handle_error(exc)
        print(f"   ❌ [{resp['status_code']}] {resp['body']}")

    # Scenario 4: Graceful degradation
    print("\n4. Fallback for non-critical data:")
    analytics = await with_fallback(
        lambda: asyncio.coroutine(lambda: (_ for _ in ()).throw(RuntimeError("Analytics down")))(),  # noqa: E501
        fallback_value={"page_views": 0},
        on_error=lambda _exc: print("   ⚠️ Analytics unavailable, using fallback"),
    )
    print(f"   Result: {analytics}")


if __name__ == "__main__":
    asyncio.run(main())
