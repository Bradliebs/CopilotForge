"""
api-client.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    A typed async HTTP client wrapper using httpx. Includes auth header
    injection, automatic retry with exponential backoff, configurable
    timeouts, and structured response parsing with error handling.

WHEN TO USE THIS:
    When your project calls external APIs and you want consistent error
    handling, automatic retries, and typed responses with modern async Python.

HOW TO RUN:
    1. pip install httpx
    2. python cookbook/api-client.py

PREREQUISITES:
    - Python 3.10+
    - httpx >= 0.25.0
"""

from __future__ import annotations

import asyncio
import math
import os
import random
from dataclasses import dataclass, field
from typing import Any, TypeVar

import httpx

# --- Types ---

T = TypeVar("T")


@dataclass
class ApiClientConfig:
    base_url: str
    timeout_seconds: float = 30.0
    max_retries: int = 2
    retry_base_delay: float = 0.5
    default_headers: dict[str, str] = field(default_factory=dict)
    auth_token: str | None = None


@dataclass
class ApiResponse:
    """Typed wrapper around an HTTP response."""

    data: Any
    status_code: int
    headers: httpx.Headers


# --- Errors ---


class ApiError(Exception):
    """Raised when the API returns a non-2xx status code."""

    def __init__(self, message: str, status_code: int, body: Any) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.body = body
        self.is_retryable = status_code == 429 or status_code >= 500


class ApiTimeoutError(Exception):
    """Raised when a request times out."""

    def __init__(self, url: str, timeout: float) -> None:
        super().__init__(f"Request to '{url}' timed out after {timeout}s")


# --- API Client ---


class ApiClient:
    """
    Async HTTP client with retry, auth, and structured error handling.

    Usage::

        async with ApiClient(ApiClientConfig(base_url="https://api.example.com")) as client:
            response = await client.get("/users")
            print(response.data)
    """

    def __init__(self, config: ApiClientConfig) -> None:
        self._config = config
        self._base_url = config.base_url.rstrip("/")
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "ApiClient":
        headers = {"Accept": "application/json", **self._config.default_headers}
        if self._config.auth_token:
            headers["Authorization"] = f"Bearer {self._config.auth_token}"

        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers=headers,
            timeout=httpx.Timeout(self._config.timeout_seconds),
        )
        return self

    async def __aexit__(self, *exc: object) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    # --- Public methods ---

    async def get(self, path: str, *, params: dict[str, Any] | None = None) -> ApiResponse:
        return await self._request("GET", path, params=params)

    async def post(self, path: str, *, json: Any = None, params: dict[str, Any] | None = None) -> ApiResponse:
        return await self._request("POST", path, json=json, params=params)

    async def put(self, path: str, *, json: Any = None, params: dict[str, Any] | None = None) -> ApiResponse:
        return await self._request("PUT", path, json=json, params=params)

    async def patch(self, path: str, *, json: Any = None, params: dict[str, Any] | None = None) -> ApiResponse:
        return await self._request("PATCH", path, json=json, params=params)

    async def delete(self, path: str, *, params: dict[str, Any] | None = None) -> ApiResponse:
        return await self._request("DELETE", path, params=params)

    # --- Core request logic ---

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: Any = None,
        params: dict[str, Any] | None = None,
    ) -> ApiResponse:
        if self._client is None:
            raise RuntimeError("ApiClient must be used as an async context manager")

        last_error: BaseException | None = None

        for attempt in range(self._config.max_retries + 1):
            try:
                response = await self._client.request(
                    method, path, json=json, params=params
                )

                # Parse response body.
                content_type = response.headers.get("content-type", "")
                data: Any
                if "application/json" in content_type:
                    data = response.json()
                else:
                    data = response.text

                # Non-2xx status — raise ApiError.
                if not response.is_success:
                    raise ApiError(
                        f"{method} {path} returned {response.status_code}",
                        response.status_code,
                        data,
                    )

                return ApiResponse(
                    data=data,
                    status_code=response.status_code,
                    headers=response.headers,
                )

            except httpx.TimeoutException:
                raise ApiTimeoutError(
                    f"{self._base_url}{path}", self._config.timeout_seconds
                ) from None

            except ApiError as exc:
                last_error = exc
                is_last = attempt >= self._config.max_retries

                if not exc.is_retryable or is_last:
                    raise

                delay = self._config.retry_base_delay * (2**attempt) + random.random() * self._config.retry_base_delay
                print(
                    f"  [api-client] Retry {attempt + 1}/{self._config.max_retries} "
                    f"for {method} {path} in {delay:.1f}s"
                )
                await asyncio.sleep(delay)

        # Unreachable, but satisfies the type checker.
        raise last_error  # type: ignore[misc]


# --- Example Usage ---


async def main() -> None:
    print("=== API Client Recipe ===\n")

    # TODO: Replace with your actual API base URL and auth token.
    config = ApiClientConfig(
        base_url="https://jsonplaceholder.typicode.com",
        timeout_seconds=10.0,
        max_retries=2,
        auth_token=os.environ.get("API_TOKEN", "demo-token"),
    )

    async with ApiClient(config) as client:
        try:
            # GET with query params.
            print("1. GET /todos (first 3):")
            resp = await client.get("/todos", params={"_limit": 3})
            for todo in resp.data:
                check = "✅" if todo["completed"] else "⬜"
                print(f"   {check} [{todo['id']}] {todo['title']}")

            # POST request.
            print("\n2. POST /todos:")
            resp = await client.post(
                "/todos",
                json={"title": "Write cookbook recipe", "completed": False, "userId": 1},
            )
            print(f"   Created todo #{resp.data['id']} (status: {resp.status_code})")

            # GET single item.
            print("\n3. GET /todos/1:")
            resp = await client.get("/todos/1")
            status = "done" if resp.data["completed"] else "pending"
            print(f"   {resp.data['title']} — {status}")

        except ApiError as exc:
            print(f"API error [{exc.status_code}]: {exc}")
        except ApiTimeoutError as exc:
            print(f"Timeout: {exc}")
        except Exception as exc:
            print(f"Unexpected error: {exc}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
