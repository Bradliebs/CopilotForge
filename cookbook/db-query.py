"""
db-query.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    Demonstrates SQLAlchemy database patterns: typed models, session management,
    CRUD operations, transactions, error handling, and connection management
    using the modern async SQLAlchemy API (2.0 style).

WHEN TO USE THIS:
    When your Python project uses SQLAlchemy for database access and you want
    patterns for common operations — creating records, querying with filters,
    updating safely, handling constraint violations, and using transactions.

HOW TO RUN:
    1. pip install "sqlalchemy[asyncio]" aiosqlite
    2. python cookbook/db-query.py

PREREQUISITES:
    - Python 3.10+
    - sqlalchemy >= 2.0
    - aiosqlite (for async SQLite; swap for asyncpg for PostgreSQL)

PLATFORM NOTES:
    - Windows: Use backslashes in paths or os.path.join() (both shown in code)
    - macOS/Linux: Forward slashes work natively
    - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Sequence

from sqlalchemy import ForeignKey, String, Text, Boolean, DateTime, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, selectinload


# --- Models ---


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

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

    posts: Mapped[list["Post"]] = relationship(back_populates="author", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"User(id={self.id}, email={self.email!r}, role={self.role!r})"


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    author: Mapped["User"] = relationship(back_populates="posts")

    def __repr__(self) -> str:
        return f"Post(id={self.id}, title={self.title!r}, published={self.published})"


# --- Database Setup ---

# TODO: Replace with your actual connection string.
# PostgreSQL: "postgresql+asyncpg://user:pass@localhost:5432/mydb"
# SQLite (async): "sqlite+aiosqlite:///./app.db"
DATABASE_URL = "sqlite+aiosqlite:///./cookbook_demo.db"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    """Create all tables. In production, use Alembic migrations instead."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# --- CRUD Operations ---


async def create_user(session: AsyncSession, *, email: str, name: str, role: str = "member") -> User:
    """
    Creates a new user. Raises a descriptive error if the email already exists.
    """
    user = User(email=email, name=name, role=role)
    session.add(user)

    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        raise ValueError(f"User with email '{email}' already exists")

    print(f"[db] Created user: {user.email} (id={user.id})")
    return user


async def find_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    """Finds a user by ID with their published posts eagerly loaded."""
    stmt = (
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.posts))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_users(
    session: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 20,
    role: str | None = None,
) -> tuple[Sequence[User], int]:
    """Lists users with pagination and optional role filter."""
    stmt = select(User).order_by(User.created_at.desc())

    if role:
        stmt = stmt.where(User.role == role)

    # Count total.
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    # Paginate.
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await session.execute(stmt)
    users = result.scalars().all()

    return users, total


async def update_user(session: AsyncSession, user_id: int, **data: str) -> User:
    """Updates a user by ID. Raises ValueError if not found."""
    user = await session.get(User, user_id)
    if user is None:
        raise ValueError(f"User with id {user_id} not found")

    for key, value in data.items():
        if hasattr(user, key):
            setattr(user, key, value)

    await session.flush()
    return user


async def delete_user_with_posts(session: AsyncSession, user_id: int) -> int:
    """
    Deletes a user and all their posts. Returns the number of deleted posts.
    Uses cascade delete via the relationship definition.
    """
    user = await session.get(User, user_id)
    if user is None:
        raise ValueError(f"User with id {user_id} not found")

    # Posts are cascade-deleted via the relationship.
    post_count = len(user.posts) if "posts" in user.__dict__ else 0
    await session.delete(user)
    await session.flush()

    print(f"[db] Deleted user '{user.email}' and {post_count} post(s)")
    return post_count


# --- Transaction: Create User with Posts ---


async def create_user_with_posts(
    session: AsyncSession,
    user_data: dict[str, str],
    posts_data: list[dict[str, str | bool]],
) -> tuple[User, list[Post]]:
    """
    Creates a user and their initial posts in a single transaction.
    If any step fails, everything is rolled back.
    """
    user = User(email=user_data["email"], name=user_data["name"])
    session.add(user)
    await session.flush()  # Get the user ID.

    posts: list[Post] = []
    for pd in posts_data:
        post = Post(
            title=str(pd["title"]),
            content=str(pd.get("content", "")),
            published=bool(pd.get("published", False)),
            author_id=user.id,
        )
        session.add(post)
        posts.append(post)

    await session.flush()
    print(f"[db] Created user '{user.email}' with {len(posts)} post(s)")
    return user, posts


# --- Example Usage ---


async def main() -> None:
    print("=== Database Query Recipe (SQLAlchemy) ===\n")

    # Initialize the database.
    await init_db()

    async with async_session() as session, session.begin():
        # 1. Create a user.
        print("1. Creating user:")
        alice = await create_user(session, email="alice@example.com", name="Alice", role="admin")
        print(f"   ✅ Created: {alice.name} (id={alice.id})\n")

        # 2. Create user with posts (same transaction).
        print("2. Creating user with posts (transaction):")
        bob, posts = await create_user_with_posts(
            session,
            {"email": "bob@example.com", "name": "Bob"},
            [
                {"title": "Getting Started with SQLAlchemy", "content": "...", "published": True},
                {"title": "Draft: Advanced Queries", "content": "WIP"},
            ],
        )
        print(f"   ✅ Created: {bob.name} with {len(posts)} posts\n")

        # 3. Query with pagination.
        print("3. Listing users (page 1):")
        users, total = await list_users(session, page=1, page_size=10)
        for u in users:
            print(f"   {u.name} ({u.role})")
        print(f"   Total: {total}\n")

        # 4. Update a user.
        print("4. Updating user role:")
        updated = await update_user(session, bob.id, role="editor")
        print(f"   ✅ {updated.name} is now '{updated.role}'\n")

        # 5. Find with related data.
        print("5. Finding user with posts:")
        found = await find_user_by_id(session, bob.id)
        if found:
            published = [p for p in found.posts if p.published]
            print(f"   {found.name}: {len(published)} published post(s)")
            for p in published:
                print(f"     - {p.title}")

    # Clean up.
    await engine.dispose()
    print("\n[db] Disconnected.")


if __name__ == "__main__":
    asyncio.run(main())
