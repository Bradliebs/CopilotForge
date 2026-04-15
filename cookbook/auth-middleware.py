"""
auth-middleware.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    FastAPI dependency for JWT-based authentication and role-based access
    control. Verifies tokens using PyJWT, extracts user info, checks roles,
    and returns proper HTTP error responses.

WHEN TO USE THIS:
    When your FastAPI app needs token-based auth with role checking — e.g.,
    protect admin routes, verify API tokens, enforce permissions per endpoint.

HOW TO RUN:
    1. pip install fastapi uvicorn pyjwt[crypto]
    2. uvicorn cookbook.auth-middleware:app --reload
    (Or: python cookbook/auth-middleware.py)

PREREQUISITES:
    - Python 3.10+
    - fastapi >= 0.100
    - pyjwt[crypto] >= 2.8
    - uvicorn >= 0.23
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# --- Configuration ---

# TODO: Replace with your actual secret. In production, load from environment.
JWT_SECRET = os.environ.get("AUTH_SECRET", "your-256-bit-secret-replace-in-production")
JWT_ALGORITHM = "HS256"
JWT_ISSUER = "copilotforge"
JWT_AUDIENCE = "copilotforge-api"

# --- Types ---


@dataclass
class AuthUser:
    """Authenticated user extracted from the JWT."""

    id: str
    email: str
    roles: list[str]


# --- Security Scheme ---

bearer_scheme = HTTPBearer(
    description="JWT Bearer token. Format: Bearer <token>",
    auto_error=False,
)


# --- Dependencies ---


async def authenticate(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> AuthUser:
    """
    FastAPI dependency that verifies the JWT and returns the authenticated user.
    Raises 401 if the token is missing, expired, or invalid.

    Usage::

        @app.get("/api/profile")
        async def profile(user: AuthUser = Depends(authenticate)):
            return {"user": user}
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "MISSING_TOKEN", "message": "Authorization header is required"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Token has expired. Please refresh your token."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token verification failed"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate required claims.
    sub = payload.get("sub")
    email = payload.get("email")
    roles = payload.get("roles")

    if not sub or not email or not isinstance(roles, list):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CLAIMS", "message": "Token is missing required claims (sub, email, roles)"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthUser(id=sub, email=email, roles=roles)


class RequireRoles:
    """
    FastAPI dependency that checks the authenticated user has at least one
    of the required roles. Returns 403 if the user lacks permission.

    Usage::

        @app.get("/admin", dependencies=[Depends(RequireRoles("admin"))])
        async def admin_panel(user: AuthUser = Depends(authenticate)):
            ...
    """

    def __init__(self, *roles: str) -> None:
        self.roles = roles

    async def __call__(self, user: AuthUser = Depends(authenticate)) -> AuthUser:
        has_role = any(role in user.roles for role in self.roles)

        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": (
                        f"Requires one of: {', '.join(self.roles)}. "
                        f"You have: {', '.join(user.roles) or 'none'}"
                    ),
                },
            )

        return user


# --- Token Generation Helper ---


def create_token(user: AuthUser, *, expires_in_minutes: int = 60) -> str:
    """
    Create a signed JWT for a user. Useful for login endpoints and testing.

    Usage::

        token = create_token(AuthUser(id="u-123", email="alice@example.com", roles=["admin"]))
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.id,
        "email": user.email,
        "roles": user.roles,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": now,
        "exp": now + timedelta(minutes=expires_in_minutes),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# --- Example: FastAPI App ---

app = FastAPI(title="Auth Middleware Example")


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Public route — no auth needed."""
    return {"status": "ok"}


@app.get("/api/profile")
async def get_profile(user: AuthUser = Depends(authenticate)) -> dict[str, object]:
    """Protected route — any authenticated user."""
    return {"user": {"id": user.id, "email": user.email, "roles": user.roles}}


@app.get("/api/admin/users")
async def list_users(user: AuthUser = Depends(RequireRoles("admin"))) -> dict[str, object]:
    """Admin-only route — requires 'admin' role."""
    return {"users": [{"id": "u-123", "name": "Alice"}]}


@app.post("/api/content")
async def create_content(user: AuthUser = Depends(RequireRoles("admin", "editor"))) -> dict[str, str]:
    """Editor or admin route — requires either role."""
    return {"message": f"Content created by {user.email}"}


# --- Startup ---


def main() -> None:
    demo_user = AuthUser(id="u-123", email="alice@example.com", roles=["admin"])
    token = create_token(demo_user)

    print("=== Auth Middleware Recipe ===\n")
    print(f"Demo JWT token generated for: {demo_user.email}")
    print(f"Roles: {', '.join(demo_user.roles)}")
    print(f"\nToken (first 50 chars): {token[:50]}...")
    print(f'\nUsage:\n  curl -H "Authorization: Bearer {token[:20]}..." http://localhost:8000/api/profile')

    # TODO: Replace host/port with your preferred values.
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
