/**
 * route-handler.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Demonstrates an Express route handler with Zod input validation,
 *   typed request/response, centralized error middleware, and proper
 *   HTTP status codes. Shows patterns for GET (list/detail), POST (create),
 *   and PATCH (update) endpoints.
 *
 * WHEN TO USE THIS:
 *   When building Express APIs and you want consistent request validation,
 *   error responses, and typed handlers — without a heavyweight framework.
 *
 * HOW TO RUN:
 *   1. npm install express zod
 *   2. npm install -D @types/express
 *   3. npx ts-node cookbook/route-handler.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - express ^4.18
 *   - zod ^3.22
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join() (both shown in code)
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 */

import express, { Request, Response, NextFunction, Router } from "express";
import { z, ZodError, ZodSchema } from "zod";

// --- Validation Middleware ---

/**
 * Generic validation middleware that validates request body, query, or params
 * against a Zod schema. Returns 400 with structured errors on failure.
 *
 * Usage:
 *   router.post("/items", validate(createItemSchema, "body"), createItem);
 *   router.get("/items", validate(listQuerySchema, "query"), listItems);
 */
function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: errors,
        },
      });
      return;
    }

    // Replace with parsed (and coerced) values.
    req[source] = result.data;
    next();
  };
}

// --- Error Middleware ---

/** App-level error with status code and error code. */
class RouteError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "RouteError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Centralized error handler. Place at the end of your middleware chain.
 * Catches RouteError (operational) and unknown errors (500).
 */
function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof RouteError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Validation failed", details: errors },
    });
    return;
  }

  // Unknown error — log and return generic 500.
  console.error("[ERROR]", err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}

// --- Schemas ---

const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 chars or less"),
  description: z.string().max(500).optional(),
  price: z.number().positive("Price must be positive"),
  tags: z.array(z.string()).max(10).default([]),
});

const updateItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().positive().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

const itemIdSchema = z.object({
  id: z.string().uuid("Invalid item ID format"),
});

// --- Types (inferred from schemas) ---

type CreateItemInput = z.infer<typeof createItemSchema>;
type UpdateItemInput = z.infer<typeof updateItemSchema>;
type ListQuery = z.infer<typeof listQuerySchema>;

interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  tags: string[];
  createdAt: string;
}

// --- In-Memory Store (replace with real database) ---

const items: Map<string, Item> = new Map();

// Seed with demo data.
const demoId = "550e8400-e29b-41d4-a716-446655440000";
items.set(demoId, {
  id: demoId,
  name: "CopilotForge Starter Kit",
  description: "Everything you need to get started",
  price: 29.99,
  tags: ["starter", "toolkit"],
  createdAt: new Date().toISOString(),
});

// --- Route Handlers ---

const router = Router();

/** GET /items — List items with pagination and search. */
router.get("/items", validate(listQuerySchema, "query"), (req: Request, res: Response) => {
  const query = req.query as unknown as ListQuery;

  let results = Array.from(items.values());

  // Filter by search term.
  if (query.search) {
    const term = query.search.toLowerCase();
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
    );
  }

  // Paginate.
  const total = results.length;
  const start = (query.page - 1) * query.pageSize;
  const paged = results.slice(start, start + query.pageSize);

  res.json({
    data: paged,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  });
});

/** GET /items/:id — Get a single item by ID. */
router.get("/items/:id", validate(itemIdSchema, "params"), (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const item = items.get(id);

  if (!item) {
    return next(new RouteError(`Item '${id}' not found`, 404, "NOT_FOUND"));
  }

  res.json({ data: item });
});

/** POST /items — Create a new item. */
router.post("/items", validate(createItemSchema, "body"), (req: Request, res: Response) => {
  const input = req.body as CreateItemInput;

  // TODO: Replace with real ID generation (e.g., uuid).
  const id = crypto.randomUUID();

  const item: Item = {
    id,
    name: input.name,
    description: input.description,
    price: input.price,
    tags: input.tags,
    createdAt: new Date().toISOString(),
  };

  items.set(id, item);
  console.log(`[route] Created item: ${item.name} (${id})`);

  res.status(201).json({ data: item });
});

/** PATCH /items/:id — Update an existing item. */
router.patch(
  "/items/:id",
  validate(itemIdSchema, "params"),
  validate(updateItemSchema, "body"),
  (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const item = items.get(id);

    if (!item) {
      return next(new RouteError(`Item '${id}' not found`, 404, "NOT_FOUND"));
    }

    const input = req.body as UpdateItemInput;

    // Apply partial updates.
    if (input.name !== undefined) item.name = input.name;
    if (input.description !== undefined) item.description = input.description;
    if (input.price !== undefined) item.price = input.price;
    if (input.tags !== undefined) item.tags = input.tags;

    console.log(`[route] Updated item: ${item.name} (${id})`);
    res.json({ data: item });
  }
);

/** DELETE /items/:id — Delete an item. */
router.delete("/items/:id", validate(itemIdSchema, "params"), (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!items.has(id)) {
    return next(new RouteError(`Item '${id}' not found`, 404, "NOT_FOUND"));
  }

  items.delete(id);
  console.log(`[route] Deleted item: ${id}`);

  res.status(204).send();
});

// --- App Setup ---

async function main() {
  const app = express();
  app.use(express.json());

  // Mount routes.
  app.use("/api", router);

  // Error handler must be last.
  app.use(errorHandler);

  // TODO: Replace port with your preferred port.
  const PORT = parseInt(process.env.PORT ?? "3200", 10);
  app.listen(PORT, () => {
    console.log("=== Route Handler Recipe ===\n");
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log("\nRoutes:");
    console.log("  GET    /api/items          — list with pagination & search");
    console.log("  GET    /api/items/:id      — get single item");
    console.log("  POST   /api/items          — create item");
    console.log("  PATCH  /api/items/:id      — update item");
    console.log("  DELETE /api/items/:id      — delete item");
    console.log(`\nTry: curl http://localhost:${PORT}/api/items`);
  });
}

main().catch(console.error);
