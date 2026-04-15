/**
 * auth-middleware.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Express middleware for JWT-based authentication and role-based access
 *   control. Verifies tokens using the `jose` library (no passport needed),
 *   extracts user info, checks roles, and returns proper HTTP error responses.
 *
 * WHEN TO USE THIS:
 *   When your Express API needs token-based auth with role checking — e.g.,
 *   protect admin routes, verify API tokens, enforce permissions per endpoint.
 *
 * HOW TO RUN:
 *   1. npm install express jose
 *   2. npm install -D @types/express
 *   3. npx ts-node cookbook/auth-middleware.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - express ^4.18
 *   - jose ^5.0 (for JWT verification)
 */

import express, { Request, Response, NextFunction, RequestHandler } from "express";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";

// --- Types ---

interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

interface AuthPayload extends JWTPayload {
  sub: string;
  email: string;
  roles: string[];
}

/** Extends Express Request to include the authenticated user. */
interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// --- Auth Errors ---

class AuthError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

// --- Configuration ---

// TODO: Replace with your actual secret. In production, load from environment.
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "your-256-bit-secret-replace-in-production"
);
const JWT_ISSUER = "copilotforge";
const JWT_AUDIENCE = "copilotforge-api";

// --- Middleware: Authenticate ---

/**
 * Verifies the JWT from the Authorization header and attaches the user
 * to `req.user`. Returns 401 if the token is missing or invalid.
 *
 * Usage:
 *   app.use("/api", authenticate);
 */
function authenticate(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: { code: "MISSING_TOKEN", message: "Authorization header is required" },
      });
      return;
    }

    // Expect "Bearer <token>" format.
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        error: { code: "INVALID_FORMAT", message: "Authorization header must be: Bearer <token>" },
      });
      return;
    }

    const token = parts[1];

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });

      const authPayload = payload as AuthPayload;

      // Validate required claims.
      if (!authPayload.sub || !authPayload.email || !Array.isArray(authPayload.roles)) {
        res.status(401).json({
          error: { code: "INVALID_CLAIMS", message: "Token is missing required claims (sub, email, roles)" },
        });
        return;
      }

      // Attach user to request.
      (req as AuthenticatedRequest).user = {
        id: authPayload.sub,
        email: authPayload.email,
        roles: authPayload.roles,
      };

      next();
    } catch (error) {
      if (error instanceof Error && error.message.includes("expired")) {
        res.status(401).json({
          error: { code: "TOKEN_EXPIRED", message: "Token has expired. Please refresh your token." },
        });
        return;
      }

      res.status(401).json({
        error: { code: "INVALID_TOKEN", message: "Token verification failed" },
      });
    }
  };
}

// --- Middleware: Require Roles ---

/**
 * Checks that the authenticated user has at least one of the required roles.
 * Returns 403 if the user lacks permission. Must be used after `authenticate()`.
 *
 * Usage:
 *   app.get("/admin", authenticate(), requireRoles("admin"), handler);
 *   app.get("/edit", authenticate(), requireRoles("admin", "editor"), handler);
 */
function requireRoles(...roles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        error: { code: "NOT_AUTHENTICATED", message: "Authentication is required before checking roles" },
      });
      return;
    }

    const hasRole = roles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Requires one of: ${roles.join(", ")}. You have: ${user.roles.join(", ") || "none"}`,
        },
      });
      return;
    }

    next();
  };
}

// --- Token Generation Helper ---

/**
 * Creates a signed JWT for a user. Useful for login endpoints and testing.
 *
 * Usage:
 *   const token = await createToken({ id: "u-123", email: "alice@example.com", roles: ["admin"] });
 */
async function createToken(
  user: AuthUser,
  options?: { expiresIn?: string }
): Promise<string> {
  return new SignJWT({ email: user.email, roles: user.roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(options?.expiresIn ?? "1h")
    .sign(JWT_SECRET);
}

// --- Example: Express App ---

async function main() {
  const app = express();
  app.use(express.json());

  // Public route — no auth needed.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Protected route — any authenticated user.
  app.get("/api/profile", authenticate(), (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    res.json({ user });
  });

  // Admin-only route — requires "admin" role.
  app.get(
    "/api/admin/users",
    authenticate(),
    requireRoles("admin"),
    (_req: Request, res: Response) => {
      res.json({ users: [{ id: "u-123", name: "Alice" }] });
    }
  );

  // Editor or admin route — requires either role.
  app.post(
    "/api/content",
    authenticate(),
    requireRoles("admin", "editor"),
    (req: Request, res: Response) => {
      const user = (req as AuthenticatedRequest).user;
      res.json({ message: `Content created by ${user.email}` });
    }
  );

  // --- Demo: generate a token and test ---

  const demoUser: AuthUser = { id: "u-123", email: "alice@example.com", roles: ["admin"] };
  const token = await createToken(demoUser);
  console.log("=== Auth Middleware Recipe ===\n");
  console.log("Demo JWT token generated for:", demoUser.email);
  console.log("Roles:", demoUser.roles.join(", "));
  console.log("\nToken (first 50 chars):", token.substring(0, 50) + "...");
  console.log("\nUsage:");
  console.log(`  curl -H "Authorization: Bearer ${token.substring(0, 20)}..." http://localhost:3100/api/profile`);

  // TODO: Replace port with your preferred port.
  const PORT = parseInt(process.env.PORT ?? "3100", 10);
  app.listen(PORT, () => {
    console.log(`\nServer listening on http://localhost:${PORT}`);
    console.log("Routes:");
    console.log("  GET  /health           — public");
    console.log("  GET  /api/profile      — any authenticated user");
    console.log("  GET  /api/admin/users  — admin only");
    console.log("  POST /api/content      — admin or editor");
  });
}

main().catch(console.error);
