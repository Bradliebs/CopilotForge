/**
 * api-client.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   A typed HTTP client wrapper using native fetch. Includes auth header
 *   injection, automatic retry with exponential backoff, configurable
 *   timeouts, and structured response parsing with error handling.
 *
 * WHEN TO USE THIS:
 *   When your project calls external APIs and you want consistent error
 *   handling, automatic retries, and typed responses without adding axios
 *   or other HTTP libraries.
 *
 * HOW TO RUN:
 *   1. npx ts-node cookbook/api-client.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+ (native fetch required)
 *   - TypeScript 5+
 */

// --- Types ---

interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  defaultHeaders?: Record<string, string>;
  getAuthHeaders?: () => Promise<Record<string, string>> | Record<string, string>;
}

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  maxRetries?: number;
  params?: Record<string, string | number | boolean>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

// --- Errors ---

class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly isRetryable: boolean;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.isRetryable = status === 429 || status >= 500;
  }
}

class ApiTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to '${url}' timed out after ${timeoutMs}ms`);
    this.name = "ApiTimeoutError";
  }
}

// --- API Client ---

class ApiClient {
  private config: Required<
    Pick<ApiClientConfig, "baseUrl" | "timeoutMs" | "maxRetries" | "retryBaseDelayMs" | "defaultHeaders">
  > & { getAuthHeaders?: ApiClientConfig["getAuthHeaders"] };

  constructor(config: ApiClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/+$/, ""),
      timeoutMs: config.timeoutMs ?? 30_000,
      maxRetries: config.maxRetries ?? 2,
      retryBaseDelayMs: config.retryBaseDelayMs ?? 500,
      defaultHeaders: config.defaultHeaders ?? {},
      getAuthHeaders: config.getAuthHeaders,
    };
  }

  async get<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  async post<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  async put<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  async patch<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  async delete<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  private async request<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    const method = options.method ?? "GET";
    const url = this.buildUrl(path, options.params);
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;
    const maxRetries = options.maxRetries ?? this.config.maxRetries;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...this.config.defaultHeaders,
    };

    if (this.config.getAuthHeaders) {
      const authHeaders = await this.config.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          method,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        }, timeoutMs);

        const contentType = response.headers.get("content-type") ?? "";
        let data: unknown;

        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (!response.ok) {
          throw new ApiError(
            `${method} ${path} returned ${response.status}`,
            response.status,
            data,
          );
        }

        return { data: data as T, status: response.status, headers: response.headers };
      } catch (error) {
        lastError = error;

        const isRetryable =
          error instanceof ApiError ? error.isRetryable :
          error instanceof ApiTimeoutError ? true :
          false;

        const isLastAttempt = attempt >= maxRetries;

        if (!isRetryable || isLastAttempt) {
          throw error;
        }

        const delay = this.config.retryBaseDelayMs * Math.pow(2, attempt) + Math.random() * this.config.retryBaseDelayMs;
        console.log(`  [api-client] Retry ${attempt + 1}/${maxRetries} for ${method} ${path} in ${Math.round(delay)}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiTimeoutError(url, timeoutMs);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.config.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}

// --- Example Usage ---

async function main() {
  console.log("=== {{project_name}} API Client ===\n");

  // TODO: Replace with your actual API base URL.
  const client = new ApiClient({
    baseUrl: "{{api_base_url}}",
    timeoutMs: 10_000,
    maxRetries: 2,
    getAuthHeaders: async () => ({
      // TODO: Replace with real token retrieval.
      Authorization: `Bearer ${process.env.API_TOKEN ?? "{{api_token}}"}`,
    }),
  });

  try {
    // GET request with query params.
    console.log("1. GET /{{resource_path}} (first 3):");
    const { data: items } = await client.get<any[]>("/{{resource_path}}", {
      params: { _limit: 3 },
    });
    for (const item of items) {
      console.log(`   [${item.id}] ${item.name ?? item.title}`);
    }

    // POST request.
    console.log("\n2. POST /{{resource_path}}:");
    const { data: created, status } = await client.post<any>("/{{resource_path}}", {
      name: "New item from {{project_name}}",
    });
    console.log(`   Created #${created.id} (status: ${status})`);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API error [${error.status}]:`, error.message);
    } else if (error instanceof ApiTimeoutError) {
      console.error("Timeout:", error.message);
    } else {
      console.error("Unexpected error:", error);
      throw error;
    }
  }
}

main().catch(console.error);
