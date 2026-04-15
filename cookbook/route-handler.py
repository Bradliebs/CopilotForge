"""
route-handler.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Demonstrates a FastAPI route handler with Pydantic input validation,
    dependency injection, proper HTTP status codes, and structured error
    responses. Shows patterns for GET (list/detail), POST (create),
    and PATCH (update) endpoints.

WHEN TO USE THIS:
    When building FastAPI applications and you want consistent request
    validation, error responses, and typed route handlers.

HOW TO RUN:
    1. pip install fastapi uvicorn
    2. uvicorn cookbook.route-handler:app --reload
    (Or: python cookbook/route-handler.py)

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


class CreateItemRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100, description="Item name")
    description: str | None = Field(default=None, max_length=500, description="Optional description")
    price: float = Field(gt=0, description="Price must be positive")
    tags: list[str] = Field(default_factory=list, max_length=10, description="Up to 10 tags")


class UpdateItemRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    price: float | None = Field(default=None, gt=0)
    tags: list[str] | None = Field(default=None, max_length=10)


class ItemResponse(BaseModel):
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


class ItemListResponse(BaseModel):
    data: list[ItemResponse]
    pagination: PaginationInfo


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: list[dict[str, str]] | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


# --- In-Memory Store (replace with real database) ---

items_store: dict[str, ItemResponse] = {}

# Seed with demo data.
_demo_id = "550e8400-e29b-41d4-a716-446655440000"
items_store[_demo_id] = ItemResponse(
    id=_demo_id,
    name="CopilotForge Starter Kit",
    description="Everything you need to get started",
    price=29.99,
    tags=["starter", "toolkit"],
    created_at=datetime.now(timezone.utc).isoformat(),
)

# --- Dependencies ---


class ListParams:
    """Dependency for pagination and search query params."""

    def __init__(
        self,
        page: Annotated[int, Query(ge=1, description="Page number")] = 1,
        page_size: Annotated[int, Query(ge=1, le=100, alias="pageSize", description="Items per page")] = 20,
        search: Annotated[str | None, Query(description="Search by name or description")] = None,
    ) -> None:
        self.page = page
        self.page_size = page_size
        self.search = search


# --- Helper ---


def get_item_or_404(item_id: str) -> ItemResponse:
    """Look up an item by ID, raising 404 if not found."""
    item = items_store.get(item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Item '{item_id}' not found"},
        )
    return item


# --- App & Routes ---

app = FastAPI(
    title="Route Handler Example",
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        404: {"model": ErrorResponse, "description": "Not found"},
    },
)


@app.get("/api/items", response_model=ItemListResponse)
async def list_items(params: ListParams = Depends()) -> ItemListResponse:
    """List items with pagination and optional search."""
    results = list(items_store.values())

    # Filter by search term.
    if params.search:
        term = params.search.lower()
        results = [
            item
            for item in results
            if term in item.name.lower() or (item.description and term in item.description.lower())
        ]

    # Paginate.
    total = len(results)
    start = (params.page - 1) * params.page_size
    paged = results[start : start + params.page_size]

    return ItemListResponse(
        data=paged,
        pagination=PaginationInfo(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=max(1, -(-total // params.page_size)),  # Ceiling division.
        ),
    )


@app.get("/api/items/{item_id}", response_model=dict[str, ItemResponse])
async def get_item(item_id: str) -> dict[str, ItemResponse]:
    """Get a single item by ID."""
    item = get_item_or_404(item_id)
    return {"data": item}


@app.post("/api/items", response_model=dict[str, ItemResponse], status_code=status.HTTP_201_CREATED)
async def create_item(body: CreateItemRequest) -> dict[str, ItemResponse]:
    """Create a new item."""
    # TODO: Replace with real ID generation and database insert.
    item_id = str(uuid.uuid4())

    item = ItemResponse(
        id=item_id,
        name=body.name,
        description=body.description,
        price=body.price,
        tags=body.tags,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    items_store[item_id] = item
    print(f"[route] Created item: {item.name} ({item_id})")

    return {"data": item}


@app.patch("/api/items/{item_id}", response_model=dict[str, ItemResponse])
async def update_item(item_id: str, body: UpdateItemRequest) -> dict[str, ItemResponse]:
    """Update an existing item (partial update)."""
    item = get_item_or_404(item_id)

    # Apply partial updates by creating a new response with merged fields.
    update_data = body.model_dump(exclude_unset=True)
    updated = item.model_copy(update=update_data)

    items_store[item_id] = updated
    print(f"[route] Updated item: {updated.name} ({item_id})")

    return {"data": updated}


@app.delete("/api/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str) -> None:
    """Delete an item."""
    get_item_or_404(item_id)  # Raises 404 if not found.
    del items_store[item_id]
    print(f"[route] Deleted item: {item_id}")


# --- Startup ---


def main() -> None:
    print("=== Route Handler Recipe ===\n")
    # TODO: Replace host/port with your preferred values.
    uvicorn.run(app, host="0.0.0.0", port=8100)


if __name__ == "__main__":
    main()
