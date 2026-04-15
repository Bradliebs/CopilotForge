/**
 * db-query.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Demonstrates Prisma database patterns: typed CRUD operations, transactions,
 *   error handling, and connection management. Uses a mock schema definition
 *   so the patterns are clear even without a running database.
 *
 * WHEN TO USE THIS:
 *   When your TypeScript project uses Prisma for database access and you want
 *   patterns for common operations — creating records, querying with filters,
 *   updating safely, handling unique constraint violations, and using transactions.
 *
 * HOW TO RUN:
 *   1. npm install @prisma/client prisma
 *   2. Define your schema in prisma/schema.prisma (see mock schema below)
 *   3. npx prisma generate
 *   4. npx prisma db push  (or migrate)
 *   5. npx ts-node cookbook/db-query.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - @prisma/client (after generating from schema)
 *   - A database (PostgreSQL, MySQL, SQLite, etc.)
 */

/*
 * --- Mock Prisma Schema (for reference) ---
 * Put this in prisma/schema.prisma to run the examples:
 *
 * generator client {
 *   provider = "prisma-client-js"
 * }
 *
 * datasource db {
 *   provider = "postgresql"
 *   url      = env("DATABASE_URL")
 * }
 *
 * model User {
 *   id        String   @id @default(uuid())
 *   email     String   @unique
 *   name      String
 *   role      String   @default("member")
 *   posts     Post[]
 *   createdAt DateTime @default(now())
 *   updatedAt DateTime @updatedAt
 * }
 *
 * model Post {
 *   id        String   @id @default(uuid())
 *   title     String
 *   content   String?
 *   published Boolean  @default(false)
 *   author    User     @relation(fields: [authorId], references: [id])
 *   authorId  String
 *   createdAt DateTime @default(now())
 *   updatedAt DateTime @updatedAt
 * }
 */

import { PrismaClient, Prisma } from "@prisma/client";

// --- Database Client Setup ---

/**
 * Singleton Prisma client with logging in development.
 * In production, remove the log option for performance.
 */
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "warn", "error"]
      : ["error"],
});

// --- Error Handling Helpers ---

/** Checks if an error is a Prisma known-request error with a specific code. */
function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

// Prisma error codes:
//   P2002 = unique constraint violation
//   P2025 = record not found (for update/delete)
//   P2003 = foreign key constraint violation

// --- CRUD Operations ---

/**
 * Creates a new user. Returns the user or throws a descriptive error
 * if the email is already taken.
 */
async function createUser(data: { email: string; name: string; role?: string }) {
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role ?? "member",
      },
    });
    console.log(`[db] Created user: ${user.email} (${user.id})`);
    return user;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new Error(`User with email '${data.email}' already exists`);
    }
    throw error;
  }
}

/**
 * Finds a user by ID. Returns null if not found (no exception).
 */
async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      posts: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}

/**
 * Lists users with pagination and optional role filter.
 */
async function listUsers(options: { page?: number; pageSize?: number; role?: string } = {}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = {};
  if (options.role) {
    where.role = options.role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Updates a user by ID. Returns the updated user or throws if not found.
 */
async function updateUser(id: string, data: { name?: string; role?: string }) {
  try {
    return await prisma.user.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw new Error(`User '${id}' not found`);
    }
    throw error;
  }
}

/**
 * Deletes a user and all their posts in a transaction.
 * Ensures data consistency — either both are deleted or neither.
 */
async function deleteUserWithPosts(userId: string) {
  try {
    const [deletedPosts, deletedUser] = await prisma.$transaction([
      prisma.post.deleteMany({ where: { authorId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    console.log(
      `[db] Deleted user '${deletedUser.email}' and ${deletedPosts.count} post(s)`
    );
    return { deletedUser, deletedPostCount: deletedPosts.count };
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw new Error(`User '${userId}' not found`);
    }
    throw error;
  }
}

// --- Transaction: Create User with Posts ---

/**
 * Creates a user and their initial posts in a single transaction.
 * Demonstrates the interactive transaction API for complex logic.
 */
async function createUserWithPosts(
  userData: { email: string; name: string },
  posts: Array<{ title: string; content?: string; published?: boolean }>
) {
  return prisma.$transaction(async (tx) => {
    // Step 1: Create the user.
    const user = await tx.user.create({
      data: { email: userData.email, name: userData.name },
    });

    // Step 2: Create posts linked to the user.
    const createdPosts = await Promise.all(
      posts.map((post) =>
        tx.post.create({
          data: {
            title: post.title,
            content: post.content ?? null,
            published: post.published ?? false,
            authorId: user.id,
          },
        })
      )
    );

    console.log(
      `[db] Created user '${user.email}' with ${createdPosts.length} post(s)`
    );

    return { user, posts: createdPosts };
  });
}

// --- Graceful Shutdown ---

/**
 * Disconnects Prisma on process exit. Always include this to avoid
 * connection pool leaks in long-running processes.
 */
async function shutdown() {
  console.log("[db] Disconnecting...");
  await prisma.$disconnect();
}

process.on("SIGINT", () => shutdown().then(() => process.exit(0)));
process.on("SIGTERM", () => shutdown().then(() => process.exit(0)));

// --- Example Usage ---

async function main() {
  console.log("=== Database Query Recipe (Prisma) ===\n");

  // TODO: Replace DATABASE_URL with your connection string.
  // export DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"

  try {
    // 1. Create a user.
    console.log("1. Creating user:");
    const alice = await createUser({
      email: "alice@example.com",
      name: "Alice",
      role: "admin",
    });
    console.log(`   ✅ Created: ${alice.name} (${alice.id})\n`);

    // 2. Create user with posts (transaction).
    console.log("2. Creating user with posts (transaction):");
    const { user: bob, posts } = await createUserWithPosts(
      { email: "bob@example.com", name: "Bob" },
      [
        { title: "Getting Started with Prisma", content: "...", published: true },
        { title: "Draft: Advanced Queries", content: "WIP" },
      ]
    );
    console.log(`   ✅ Created: ${bob.name} with ${posts.length} posts\n`);

    // 3. Query with pagination.
    console.log("3. Listing users (page 1):");
    const result = await listUsers({ page: 1, pageSize: 10 });
    for (const u of result.users) {
      console.log(`   ${u.name} (${u.role}) — ${u._count.posts} posts`);
    }
    console.log(`   Page ${result.pagination.page}/${result.pagination.totalPages}\n`);

    // 4. Update a user.
    console.log("4. Updating user role:");
    const updated = await updateUser(bob.id, { role: "editor" });
    console.log(`   ✅ ${updated.name} is now '${updated.role}'\n`);

    // 5. Find with related data.
    console.log("5. Finding user with posts:");
    const found = await findUserById(bob.id);
    if (found) {
      console.log(`   ${found.name}: ${found.posts.length} published post(s)`);
      for (const p of found.posts) {
        console.log(`     - ${p.title}`);
      }
    }
  } catch (error) {
    console.error("Database error:", error instanceof Error ? error.message : error);
  } finally {
    await shutdown();
  }
}

main().catch(console.error);
