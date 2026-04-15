/**
 * db-query.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Demonstrates Prisma database patterns: typed CRUD operations, transactions,
 *   error handling, and connection management.
 *
 * WHEN TO USE THIS:
 *   When your TypeScript project uses Prisma for database access.
 *
 * HOW TO RUN:
 *   1. npm install @prisma/client prisma
 *   2. Define your schema in prisma/schema.prisma
 *   3. npx prisma generate && npx prisma db push
 *   4. npx ts-node cookbook/db-query.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - @prisma/client
 *   - A database (PostgreSQL, MySQL, SQLite, etc.)
 */

/*
 * --- Prisma Schema (for reference) ---
 * datasource db {
 *   provider = "postgresql"
 *   url      = env("DATABASE_URL")
 * }
 *
 * model {{model_name}} {
 *   id        String   @id @default(uuid())
 *   email     String   @unique
 *   name      String
 *   role      String   @default("member")
 *   posts     {{related_model_name}}[]
 *   createdAt DateTime @default(now())
 *   updatedAt DateTime @updatedAt
 * }
 *
 * model {{related_model_name}} {
 *   id        String   @id @default(uuid())
 *   title     String
 *   content   String?
 *   published Boolean  @default(false)
 *   author    {{model_name}}  @relation(fields: [authorId], references: [id])
 *   authorId  String
 *   createdAt DateTime @default(now())
 *   updatedAt DateTime @updatedAt
 * }
 */

import { PrismaClient, Prisma } from "@prisma/client";

// --- Database Client Setup ---

const prisma = new PrismaClient({
  // TODO: Set DATABASE_URL to {{db_connection_string}}
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "warn", "error"]
      : ["error"],
});

// --- Error Handling Helpers ---

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

// --- CRUD Operations ---

async function create{{model_name}}(data: { email: string; name: string; role?: string }) {
  try {
    const record = await prisma.{{model_name_lower}}.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role ?? "member",
      },
    });
    console.log(`[db] Created {{model_name_lower}}: ${record.email} (${record.id})`);
    return record;
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new Error(`{{model_name}} with email '${data.email}' already exists`);
    }
    throw error;
  }
}

async function find{{model_name}}ById(id: string) {
  return prisma.{{model_name_lower}}.findUnique({
    where: { id },
    include: {
      {{related_field}}: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}

async function list{{model_name}}s(options: { page?: number; pageSize?: number; role?: string } = {}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.{{model_name}}WhereInput = {};
  if (options.role) {
    where.role = options.role;
  }

  const [records, total] = await Promise.all([
    prisma.{{model_name_lower}}.findMany({
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
        _count: { select: { {{related_field}}: true } },
      },
    }),
    prisma.{{model_name_lower}}.count({ where }),
  ]);

  return {
    records,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

async function update{{model_name}}(id: string, data: { name?: string; role?: string }) {
  try {
    return await prisma.{{model_name_lower}}.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw new Error(`{{model_name}} '${id}' not found`);
    }
    throw error;
  }
}

async function delete{{model_name}}WithRelated(id: string) {
  try {
    const [deletedRelated, deletedRecord] = await prisma.$transaction([
      prisma.{{related_model_name_lower}}.deleteMany({ where: { authorId: id } }),
      prisma.{{model_name_lower}}.delete({ where: { id } }),
    ]);

    console.log(
      `[db] Deleted {{model_name_lower}} '${deletedRecord.email}' and ${deletedRelated.count} {{related_field}}`
    );
    return { deletedRecord, deletedRelatedCount: deletedRelated.count };
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw new Error(`{{model_name}} '${id}' not found`);
    }
    throw error;
  }
}

// --- Transaction: Create with Related ---

async function create{{model_name}}WithRelated(
  data: { email: string; name: string },
  relatedItems: Array<{ title: string; content?: string; published?: boolean }>
) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.{{model_name_lower}}.create({
      data: { email: data.email, name: data.name },
    });

    const created = await Promise.all(
      relatedItems.map((item) =>
        tx.{{related_model_name_lower}}.create({
          data: {
            title: item.title,
            content: item.content ?? null,
            published: item.published ?? false,
            authorId: record.id,
          },
        })
      )
    );

    console.log(
      `[db] Created {{model_name_lower}} '${record.email}' with ${created.length} {{related_field}}`
    );

    return { record, relatedItems: created };
  });
}

// --- Graceful Shutdown ---

async function shutdown() {
  console.log("[db] Disconnecting...");
  await prisma.$disconnect();
}

process.on("SIGINT", () => shutdown().then(() => process.exit(0)));
process.on("SIGTERM", () => shutdown().then(() => process.exit(0)));

// --- Example Usage ---

async function main() {
  console.log("=== {{project_name}} Database Patterns (Prisma) ===\n");

  // TODO: Set DATABASE_URL={{db_connection_string}} in your environment.

  try {
    console.log("1. Creating {{model_name_lower}}:");
    const record = await create{{model_name}}({
      email: "alice@example.com",
      name: "Alice",
      role: "admin",
    });
    console.log(`   ✅ Created: ${record.name} (${record.id})\n`);

    console.log("2. Listing {{model_name_lower}}s (page 1):");
    const result = await list{{model_name}}s({ page: 1, pageSize: 10 });
    for (const r of result.records) {
      console.log(`   ${r.name} (${r.role}) — ${r._count.{{related_field}}} {{related_field}}`);
    }
  } catch (error) {
    console.error("Database error:", error instanceof Error ? error.message : error);
  } finally {
    await shutdown();
  }
}

main().catch(console.error);
