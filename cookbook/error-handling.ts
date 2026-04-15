/**
 * error-handling.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Demonstrates robust error handling patterns for TypeScript applications:
 *   custom error class hierarchy with error codes, a retry wrapper with
 *   exponential backoff, and a request handler showing proper error propagation.
 *
 * WHEN TO USE THIS:
 *   When your project needs structured error handling — consistent error codes,
 *   automatic retries for transient failures, and graceful degradation for
 *   non-critical operations.
 *
 * HOW TO RUN:
 *   1. npx ts-node cookbook/error-handling.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *
 * PLATFORM NOTES:
 *   - Windows: Use backslashes in paths or path.join() (both shown in code)
 *   - macOS/Linux: Forward slashes work natively
 *   - Environment variables: Use $env:VAR (PowerShell) or export VAR (bash)
 */

import { randomUUID } from "node:crypto";

// --- Error Codes ---

/** Centralized error codes. Add new codes here as your app grows. */
const ErrorCode = {
  VALIDATION: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  UPSTREAM_FAILURE: "UPSTREAM_FAILURE",
  INTERNAL: "INTERNAL_ERROR",
  TIMEOUT: "TIMEOUT",
} as const;

type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// --- Custom Error Hierarchy ---

/** Base application error. All custom errors extend this. */
class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly context: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    options: { isOperational?: boolean; context?: Record<string, unknown>; cause?: Error } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = options.isOperational ?? true;
    this.context = options.context ?? {};
  }

  /** Serialize to a safe JSON shape for API responses (no stack traces). */
  toResponse(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(Object.keys(this.context).length > 0 ? { details: this.context } : {}),
      },
    };
  }
}

/** Thrown when request input fails validation. */
class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION, 400, { context });
    this.name = "ValidationError";
  }
}

/** Thrown when a requested resource does not exist. */
class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, ErrorCode.NOT_FOUND, 404, {
      context: { resource, id },
    });
    this.name = "NotFoundError";
  }
}

/** Thrown when an upstream service call fails. */
class UpstreamError extends AppError {
  constructor(service: string, cause?: Error) {
    super(`Upstream service '${service}' failed`, ErrorCode.UPSTREAM_FAILURE, 502, {
      context: { service },
      cause,
    });
    this.name = "UpstreamError";
  }
}

/** Thrown when a request exceeds the rate limit. */
class RateLimitError extends AppError {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super("Rate limit exceeded", ErrorCode.RATE_LIMITED, 429, {
      context: { retryAfterMs },
    });
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

// --- Typed Error Response ---

interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

// --- Retry with Exponential Backoff ---

interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Return true for errors that should be retried. */
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 10_000,
  shouldRetry: (error) => {
    if (error instanceof AppError) {
      return [ErrorCode.UPSTREAM_FAILURE, ErrorCode.RATE_LIMITED, ErrorCode.TIMEOUT].includes(
        error.code
      );
    }
    return false;
  },
};

/**
 * Retries an async function with exponential backoff and jitter.
 * Only retries errors that pass the `shouldRetry` check.
 *
 * Usage:
 *   const data = await withRetry(() => fetchFromApi("/users"), { maxAttempts: 3 });
 */
async function withRetry<T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === opts.maxAttempts;
      const shouldRetry = opts.shouldRetry?.(error) ?? false;

      if (isLastAttempt || !shouldRetry) {
        throw error;
      }

      // Exponential backoff with jitter to avoid thundering herd.
      const exponentialDelay = opts.baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * opts.baseDelayMs;
      const delayMs = Math.min(exponentialDelay + jitter, opts.maxDelayMs);

      opts.onRetry?.(attempt, error, delayMs);
      await sleep(delayMs);
    }
  }

  // Should not reach here, but TypeScript needs it.
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Graceful Degradation ---

interface FallbackOptions<T> {
  fallbackValue: T;
  onError?: (error: unknown) => void;
}

/**
 * Wraps an async function so that if it fails, a fallback value is returned
 * instead of throwing. Use for non-critical operations (caching, analytics, etc.).
 *
 * Usage:
 *   const prefs = await withFallback(() => fetchUserPrefs(userId), {
 *     fallbackValue: DEFAULT_PREFS,
 *   });
 */
async function withFallback<T>(fn: () => Promise<T>, options: FallbackOptions<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    options.onError?.(error);
    return options.fallbackValue;
  }
}

// --- Request Handler Example ---

interface User {
  id: string;
  name: string;
  email: string;
}

/** Simulates a database lookup. */
async function findUserById(id: string): Promise<User | null> {
  // TODO: Replace with actual database query.
  if (id === "u-123") {
    return { id: "u-123", name: "Alice", email: "alice@example.com" };
  }
  return null;
}

/** Simulates an upstream API call. */
async function fetchUserPermissions(userId: string): Promise<string[]> {
  // TODO: Replace with actual upstream API call.
  // Simulate intermittent failure for demonstration.
  if (Math.random() < 0.3) {
    throw new UpstreamError("permissions-service");
  }
  return ["read", "write"];
}

/**
 * Example request handler showing all patterns working together:
 * - Input validation (throws ValidationError)
 * - Resource lookup (throws NotFoundError)
 * - Upstream call with retry (throws UpstreamError after retries)
 * - Non-critical call with fallback (never throws)
 */
async function handleGetUser(userId: string): Promise<{ user: User; permissions: string[] }> {
  // 1. Validate input.
  if (!userId || typeof userId !== "string" || userId.length < 1) {
    throw new ValidationError("userId is required and must be a non-empty string", {
      field: "userId",
      received: userId,
    });
  }

  // 2. Look up user — throw NotFoundError if missing.
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError("User", userId);
  }

  // 3. Fetch permissions with retry — transient failures are retried.
  const permissions = await withRetry(() => fetchUserPermissions(user.id), {
    maxAttempts: 3,
    baseDelayMs: 200,
    onRetry: (attempt, _error, delayMs) => {
      console.log(`  [retry] Attempt ${attempt} failed, retrying in ${Math.round(delayMs)}ms...`);
    },
  });

  return { user, permissions };
}

// --- Top-Level Error Handler ---

/**
 * Catches all errors and converts them to structured responses.
 * In a real app this would be Express/Fastify error middleware.
 */
function handleError(error: unknown): { statusCode: number; body: ErrorResponse } {
  if (error instanceof AppError) {
    // Operational error — safe to show to the client.
    return { statusCode: error.statusCode, body: error.toResponse() };
  }

  // Unknown error — log internally, return generic message.
  console.error("[UNEXPECTED]", error);
  const generic = new AppError("An unexpected error occurred", ErrorCode.INTERNAL, 500, {
    isOperational: false,
  });
  return { statusCode: 500, body: generic.toResponse() };
}

// --- Example Usage ---

async function main() {
  console.log("=== Error Handling Recipe ===\n");

  // Scenario 1: Successful request
  console.log("1. Valid user lookup:");
  try {
    const result = await handleGetUser("u-123");
    console.log("   ✅", result.user.name, "—", result.permissions.join(", "));
  } catch (error) {
    const { statusCode, body } = handleError(error);
    console.log(`   ❌ [${statusCode}]`, JSON.stringify(body));
  }

  // Scenario 2: Not found
  console.log("\n2. Missing user:");
  try {
    await handleGetUser("u-999");
  } catch (error) {
    const { statusCode, body } = handleError(error);
    console.log(`   ❌ [${statusCode}]`, JSON.stringify(body));
  }

  // Scenario 3: Validation error
  console.log("\n3. Invalid input:");
  try {
    await handleGetUser("");
  } catch (error) {
    const { statusCode, body } = handleError(error);
    console.log(`   ❌ [${statusCode}]`, JSON.stringify(body));
  }

  // Scenario 4: Graceful degradation
  console.log("\n4. Fallback for non-critical data:");
  const analytics = await withFallback(
    async () => {
      throw new Error("Analytics service down");
    },
    {
      fallbackValue: { pageViews: 0 },
      onError: (err) => console.log("   ⚠️ Analytics unavailable, using fallback"),
    }
  );
  console.log("   Result:", analytics);
}

main().catch(console.error);
