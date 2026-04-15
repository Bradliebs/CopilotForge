/**
 * route-handler.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Demonstrates an Express route handler with Zod input validation,
 *   typed request/response, centralized error middleware, and proper
 *   HTTP status codes.
 *
 * WHEN TO USE THIS:
 *   When building Express APIs and you want consistent request validation,
 *   error responses, and typed handlers.
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
 */

import express, { Request, Response, NextFunction, Router } from "express";
import { z, ZodError, ZodSchema } from "zod";

// --- Validation Middleware ---

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

    req[source] = result.data;
    next();
  };
}

// --- Error Middleware ---

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

  console.error("[ERROR]", err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}

// --- Schemas ---

const create{{resource_type}}Schema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 chars or less"),
  description: z.string().max(500).optional(),
  price: z.number().positive("Price must be positive"),
  tags: z.array(z.string()).max(10).default([]),
});

const update{{resource_type}}Schema = z.object({
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

const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

// --- Types ---

type Create{{resource_type}}Input = z.infer<typeof create{{resource_type}}Schema>;
type Update{{resource_type}}Input = z.infer<typeof update{{resource_type}}Schema>;
type ListQuery = z.infer<typeof listQuerySchema>;

interface {{resource_type}} {
  id: string;
  name: string;
  description?: string;
  price: number;
  tags: string[];
  createdAt: string;
}

// --- In-Memory Store (replace with real database) ---

// TODO: Replace with actual database queries against {{db_connection_string}}.
const store: Map<string, {{resource_type}}> = new Map();

// --- Route Handlers ---

const router = Router();

router.get("/{{resource_path}}", validate(listQuerySchema, "query"), (req: Request, res: Response) => {
  const query = req.query as unknown as ListQuery;

  let results = Array.from(store.values());

  if (query.search) {
    const term = query.search.toLowerCase();
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
    );
  }

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

router.get("/{{resource_path}}/:id", validate(idParamSchema, "params"), (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const item = store.get(id);

  if (!item) {
    return next(new RouteError(`{{resource_type}} '${id}' not found`, 404, "NOT_FOUND"));
  }

  res.json({ data: item });
});

router.post("/{{resource_path}}", validate(create{{resource_type}}Schema, "body"), (req: Request, res: Response) => {
  const input = req.body as Create{{resource_type}}Input;
  const id = crypto.randomUUID();

  const item: {{resource_type}} = {
    id,
    name: input.name,
    description: input.description,
    price: input.price,
    tags: input.tags,
    createdAt: new Date().toISOString(),
  };

  store.set(id, item);
  res.status(201).json({ data: item });
});

router.patch(
  "/{{resource_path}}/:id",
  validate(idParamSchema, "params"),
  validate(update{{resource_type}}Schema, "body"),
  (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const item = store.get(id);

    if (!item) {
      return next(new RouteError(`{{resource_type}} '${id}' not found`, 404, "NOT_FOUND"));
    }

    const input = req.body as Update{{resource_type}}Input;

    if (input.name !== undefined) item.name = input.name;
    if (input.description !== undefined) item.description = input.description;
    if (input.price !== undefined) item.price = input.price;
    if (input.tags !== undefined) item.tags = input.tags;

    res.json({ data: item });
  }
);

router.delete("/{{resource_path}}/:id", validate(idParamSchema, "params"), (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!store.has(id)) {
    return next(new RouteError(`{{resource_type}} '${id}' not found`, 404, "NOT_FOUND"));
  }

  store.delete(id);
  res.status(204).send();
});

// --- App Setup ---

async function main() {
  const app = express();
  app.use(express.json());

  app.use("/api", router);
  app.use(errorHandler);

  // TODO: Replace port with your preferred port.
  const PORT = parseInt(process.env.PORT ?? "{{server_port}}", 10);
  app.listen(PORT, () => {
    console.log(`[{{project_name}}] Server listening on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
