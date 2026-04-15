"""
db-query.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Demonstrates SQLAlchemy database patterns: typed models, session management,
    CRUD operations, transactions, error handling, and connection management
    using the modern async SQLAlchemy API (2.0 style).

WHEN TO USE THIS:
    When your Python project uses SQLAlchemy for database access.

HOW TO RUN:
    1. pip install "sqlalchemy[asyncio]" aiosqlite
    2. python cookbook/db-query.py

PREREQUISITES:
    - Python 3.10+
    - sqlalchemy >= 2.0
    - aiosqlite (or asyncpg for PostgreSQL)
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Sequence

from sqlalchemy import ForeignKey, String, Text, Boolean, DateTime, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, selectinload


# --- Models ---


class Base(DeclarativeBase):
    pass


class {{model_name}}(Base):
    __tablename__ = "{{table_name}}"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="member")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    {{related_field}}: Mapped[list["{{related_model_name}}"]] = relationship(
        back_populates="author", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"{{model_name}}(id={self.id}, email={self.email!r}, role={self.role!r})"


class {{related_model_name}}(Base):
    __tablename__ = "{{related_table_name}}"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("{{table_name}}.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    author: Mapped["{{model_name}}"] = relationship(back_populates="{{related_field}}")

    def __repr__(self) -> str:
        return f"{{related_model_name}}(id={self.id}, title={self.title!r}, published={self.published})"


# --- Database Setup ---

# TODO: Replace with your actual connection string.
# PostgreSQL: "postgresql+asyncpg://user:pass@localhost:5432/mydb"
DATABASE_URL = "{{db_connection_string}}"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    """Create all tables. In production, use Alembic migrations instead."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# --- CRUD Operations ---


async def create_{{model_name_snake}}(
    session: AsyncSession, *, email: str, name: str, role: str = "member"
) -> {{model_name}}:
    """Creates a new {{model_name_snake}}. Raises ValueError if email exists."""
    record = {{model_name}}(email=email, name=name, role=role)
    session.add(record)

    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        raise ValueError(f"{{model_name}} with email '{email}' already exists")

    print(f"[db] Created {{model_name_snake}}: {record.email} (id={record.id})")
    return record


async def find_{{model_name_snake}}_by_id(session: AsyncSession, record_id: int) -> {{model_name}} | None:
    """Finds a {{model_name_snake}} by ID with related data eagerly loaded."""
    stmt = (
        select({{model_name}})
        .where({{model_name}}.id == record_id)
        .options(selectinload({{model_name}}.{{related_field}}))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_{{model_name_snake}}s(
    session: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 20,
    role: str | None = None,
) -> tuple[Sequence[{{model_name}}], int]:
    """Lists records with pagination and optional role filter."""
    stmt = select({{model_name}}).order_by({{model_name}}.created_at.desc())

    if role:
        stmt = stmt.where({{model_name}}.role == role)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await session.execute(stmt)
    records = result.scalars().all()

    return records, total


async def update_{{model_name_snake}}(session: AsyncSession, record_id: int, **data: str) -> {{model_name}}:
    """Updates a {{model_name_snake}} by ID. Raises ValueError if not found."""
    record = await session.get({{model_name}}, record_id)
    if record is None:
        raise ValueError(f"{{model_name}} with id {record_id} not found")

    for key, value in data.items():
        if hasattr(record, key):
            setattr(record, key, value)

    await session.flush()
    return record


# --- Transaction: Create with Related ---


async def create_{{model_name_snake}}_with_{{related_field}}(
    session: AsyncSession,
    record_data: dict[str, str],
    related_data: list[dict[str, str | bool]],
) -> tuple[{{model_name}}, list[{{related_model_name}}]]:
    """Creates a {{model_name_snake}} and related records in a single transaction."""
    record = {{model_name}}(email=record_data["email"], name=record_data["name"])
    session.add(record)
    await session.flush()

    related: list[{{related_model_name}}] = []
    for rd in related_data:
        item = {{related_model_name}}(
            title=str(rd["title"]),
            content=str(rd.get("content", "")),
            published=bool(rd.get("published", False)),
            author_id=record.id,
        )
        session.add(item)
        related.append(item)

    await session.flush()
    print(f"[db] Created {{model_name_snake}} '{record.email}' with {len(related)} {{related_field}}")
    return record, related


# --- Example Usage ---


async def main() -> None:
    print("=== {{project_name}} Database Patterns (SQLAlchemy) ===\n")

    await init_db()

    async with async_session() as session, session.begin():
        print("1. Creating {{model_name_snake}}:")
        record = await create_{{model_name_snake}}(
            session, email="alice@example.com", name="Alice", role="admin"
        )
        print(f"   ✅ Created: {record.name} (id={record.id})\n")

        print("2. Listing {{model_name_snake}}s (page 1):")
        records, total = await list_{{model_name_snake}}s(session, page=1, page_size=10)
        for r in records:
            print(f"   {r.name} ({r.role})")
        print(f"   Total: {total}\n")

    await engine.dispose()
    print("[db] Disconnected.")


if __name__ == "__main__":
    asyncio.run(main())
