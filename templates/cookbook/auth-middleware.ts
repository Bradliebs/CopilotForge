/**
 * auth-middleware.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Express middleware for JWT-based authentication and role-based access
 *   control. Verifies tokens using the `jose` library, extracts user info,
 *   checks roles, and returns proper HTTP error responses.
 *
 * WHEN TO USE THIS:
 *   When your Express API needs token-based auth with role checking.
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
 *   - jose ^5.0
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

interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// --- Configuration ---

// TODO: Replace with your actual secret from environment.
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "{{auth_secret}}"
);
const JWT_ISSUER = "{{project_name}}";
const JWT_AUDIENCE = "{{project_name}}-api";

// --- Middleware: Authenticate ---

function authenticate(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: { code: "MISSING_TOKEN", message: "Authorization header is required" },
      });
      return;
    }

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

      if (!authPayload.sub || !authPayload.email || !Array.isArray(authPayload.roles)) {
        res.status(401).json({
          error: { code: "INVALID_CLAIMS", message: "Token is missing required claims (sub, email, roles)" },
        });
        return;
      }

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
    .setExpirationTime(options?.expiresIn ?? "{{token_expiry}}")
    .sign(JWT_SECRET);
}

// --- Example: Express App ---

async function main() {
  const app = express();
  app.use(express.json());

  // Public route.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Protected route — any authenticated user.
  app.get("/api/profile", authenticate(), (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    res.json({ user });
  });

  // Admin-only route.
  app.get(
    "/api/admin/users",
    authenticate(),
    requireRoles("admin"),
    (_req: Request, res: Response) => {
      // TODO: Replace with actual user listing for {{project_name}}.
      res.json({ users: [] });
    }
  );

  // Editor or admin route.
  app.post(
    "/api/content",
    authenticate(),
    requireRoles("admin", "editor"),
    (req: Request, res: Response) => {
      const user = (req as AuthenticatedRequest).user;
      res.json({ message: `Content created by ${user.email}` });
    }
  );

  // TODO: Replace port with your preferred port.
  const PORT = parseInt(process.env.PORT ?? "{{server_port}}", 10);
  app.listen(PORT, () => {
    console.log(`[{{project_name}}] Server listening on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
