// src/lib/apiClient.ts
// Single place for all admin API calls.
// - baseURL from VITE_API_BASE_URL or default '/api'
// - Always attach Authorization: Bearer <adminToken>
// - JSON by default (FormData auto-handled)
// - 15s timeout
// - On 401: drop token and redirect to /admin/login

type Json = Record<string, any>;

const BASE_URL =
  (import.meta.env && (import.meta.env as any).VITE_API_BASE_URL) || "/api";

function safeGetToken(): string {
  try {
    return localStorage.getItem("adminToken") || "";
  } catch {
    return "";
  }
}

function safeSetToken(tok: string | null) {
  try {
    if (tok) localStorage.setItem("adminToken", tok);
    else localStorage.removeItem("adminToken");
  } catch {
    /* ignore */
  }
}

export const apiClient = {
  baseUrl: String(BASE_URL || "/api"),

  createUrl(endpoint: string) {
    const base = this.baseUrl.replace(/\/$/, "");
    const ep = String(endpoint || "").replace(/^\/+/, "");
    // collapse accidental double slashes (except after protocol)
    return `${base}/${ep}`.replace(/([^:]\/)\/+/g, "$1");
  },

  async request<T = any>(input: string, init: RequestInit = {}): Promise<T> {
    const url = this.createUrl(input);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const callerHeaders = (init.headers as Record<string, string>) || {};
      const token = safeGetToken();

      // Auto content-type only if NOT FormData
      const isForm =
        init.body &&
        typeof FormData !== "undefined" &&
        init.body instanceof FormData;

      const headers: Record<string, string> = {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...callerHeaders,
      };

      // Always attach Authorization if we have a token and caller didn't override
      if (token && !("Authorization" in headers)) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      // Read text first (handles 204, non-JSON, etc.)
      let raw: string | null = null;
      try {
        raw = await res.text();
      } catch {
        raw = null;
      } finally {
        clearTimeout(timeout);
      }

      let data: any = null;
      if (raw && raw.length) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw; // non-JSON fallback
        }
      }

      if (!res.ok) {
        // Handle 401 centrally: token invalid/expired/missing
        if (res.status === 401) {
          safeSetToken(null);
          // optional toast could be triggered here
          if (typeof window !== "undefined" && window.location) {
            // only redirect if we are inside /admin area (prevents loops)
            const path = window.location.pathname || "";
            if (!path.startsWith("/admin/login")) {
              window.location.href = "/admin/login";
            }
          }
        }
        const err: any = new Error(
          (data && (data.message || data.error)) || `HTTP ${res.status}`
        );
        err.status = res.status;
        err.data = data;
        throw err;
        }

      // success
      return (data as T) ?? ({} as T);
    } catch (err: any) {
      clearTimeout(timeout);
      if (err?.name === "AbortError") {
        const e: any = new Error("Request timed out");
        e.status = 0;
        throw e;
      }
      throw err;
    }
  },

  get<T = any>(input: string) {
    return this.request<T>(input, { method: "GET" });
  },

  post<T = any>(input: string, body?: Json | FormData) {
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    return this.request<T>(input, {
      method: "POST",
      body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });
  },

  put<T = any>(input: string, body?: Json | FormData) {
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    return this.request<T>(input, {
      method: "PUT",
      body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = any>(input: string) {
    return this.request<T>(input, { method: "DELETE" });
  },

  // helpers you can import elsewhere
  setToken(token: string) {
    safeSetToken(token);
  },
  clearToken() {
    safeSetToken(null);
  },
};
