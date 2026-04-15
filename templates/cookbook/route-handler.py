"""
route-handler.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Demonstrates a FastAPI route handler with Pydantic input validation,
    dependency injection, proper HTTP status codes, and structured error
    responses.

WHEN TO USE THIS:
    When building FastAPI applications and you want consistent request
    validation, error responses, and typed route handlers.

HOW TO RUN:
    1. pip install fastapi uvicorn
    2. uvicorn cookbook.route-handler:app --reload

PREREQUISITES:
    - Python 3.10+
    - fastapi >= 0.100
    - uvicorn >= 0.23
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Query, status
from pydantic import BaseModel, Field

# --- Schemas ---


class Create{{resource_type}}Request(BaseModel):
    name: str = Field(min_length=1, max_length=100, description="Name")
    description: str | None = Field(default=None, max_length=500, description="Optional description")
    price: float = Field(gt=0, description="Price must be positive")
    tags: list[str] = Field(default_factory=list, max_length=10, description="Up to 10 tags")


class Update{{resource_type}}Request(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    price: float | None = Field(default=None, gt=0)
    tags: list[str] | None = Field(default=None, max_length=10)


class {{resource_type}}Response(BaseModel):
    id: str
    name: str
    description: str | None = None
    price: float
    tags: list[str]
    created_at: str


class PaginationInfo(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class {{resource_type}}ListResponse(BaseModel):
    data: list[{{resource_type}}Response]
    pagination: PaginationInfo


# --- In-Memory Store (replace with real database) ---

# TODO: Replace with actual database queries against {{db_connection_string}}.
store: dict[str, {{resource_type}}Response] = {}

# --- Dependencies ---


class ListParams:
    """Dependency for pagination and search query params."""

    def __init__(
        self,
        page: Annotated[int, Query(ge=1, description="Page number")] = 1,
        page_size: Annotated[int, Query(ge=1, le=100, alias="pageSize")] = 20,
        search: Annotated[str | None, Query(description="Search term")] = None,
    ) -> None:
        self.page = page
        self.page_size = page_size
        self.search = search


# --- Helper ---


def get_or_404(item_id: str) -> {{resource_type}}Response:
    item = store.get(item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"{{resource_type}} '{item_id}' not found"},
        )
    return item


# --- App & Routes ---

app = FastAPI(title="{{project_name}} API")


@app.get("/api/{{resource_path}}", response_model={{resource_type}}ListResponse)
async def list_items(params: ListParams = Depends()) -> {{resource_type}}ListResponse:
    results = list(store.values())

    if params.search:
        term = params.search.lower()
        results = [
            item
            for item in results
            if term in item.name.lower() or (item.description and term in item.description.lower())
        ]

    total = len(results)
    start = (params.page - 1) * params.page_size
    paged = results[start : start + params.page_size]

    return {{resource_type}}ListResponse(
        data=paged,
        pagination=PaginationInfo(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=max(1, -(-total // params.page_size)),
        ),
    )


@app.get("/api/{{resource_path}}/{item_id}", response_model=dict[str, {{resource_type}}Response])
async def get_item(item_id: str) -> dict[str, {{resource_type}}Response]:
    return {"data": get_or_404(item_id)}


@app.post("/api/{{resource_path}}", response_model=dict[str, {{resource_type}}Response], status_code=status.HTTP_201_CREATED)
async def create_item(body: Create{{resource_type}}Request) -> dict[str, {{resource_type}}Response]:
    item_id = str(uuid.uuid4())

    item = {{resource_type}}Response(
        id=item_id,
        name=body.name,
        description=body.description,
        price=body.price,
        tags=body.tags,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    store[item_id] = item
    return {"data": item}


@app.patch("/api/{{resource_path}}/{item_id}", response_model=dict[str, {{resource_type}}Response])
async def update_item(item_id: str, body: Update{{resource_type}}Request) -> dict[str, {{resource_type}}Response]:
    item = get_or_404(item_id)
    update_data = body.model_dump(exclude_unset=True)
    updated = item.model_copy(update=update_data)
    store[item_id] = updated
    return {"data": updated}


@app.delete("/api/{{resource_path}}/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str) -> None:
    get_or_404(item_id)
    del store[item_id]


# --- Startup ---


def main() -> None:
    # TODO: Replace host/port with your preferred values.
    uvicorn.run(app, host="0.0.0.0", port={{server_port}})


if __name__ == "__main__":
    main()
