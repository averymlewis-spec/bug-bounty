const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Thin client wrapper around the admin REST API.
 * All mutating calls send the admin JWT so the server-side requireAdmin
 * middleware can authenticate and authorize every request.
 */
export class AdminAPI {
  token: string | null;

  constructor(token: string | null) {
    this.token = token;
  }

  private headers(extra: Record<string, string> = {}) {
    return {
      "Content-Type": "application/json",
      Authorization: this.token ? `Bearer ${this.token}` : "",
      ...extra
    };
  }

  private async request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}/api/admin${path}`, {
      ...options,
      headers: this.headers(options.headers as Record<string, string>)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      type ApiError = Error & { status?: number; data?: unknown };
      const err = new Error(json.message || res.statusText) as ApiError;
      err.status = res.status;
      err.data = json;
      throw err;
    }
    return json.data ?? json;
  }

  private qs(params: Record<string, string | number> = {}) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      search.set(k, String(v));
    }
    const str = search.toString();
    return str ? `?${str}` : "";
  }

  // Trust & Metrics
  metrics() {
    return this.request("/metrics");
  }

  // Platform Controls
  platform() {
    return this.request("/platform");
  }
  togglePlatform(key: string, value: boolean) {
    return this.request("/platform", {
      method: "PATCH",
      body: JSON.stringify({ key, value })
    });
  }

  // User Management
  users(params: Record<string, string | number> = {}) {
    return this.request(`/users${this.qs(params)}`);
  }
  user(id: string) {
    return this.request(`/users/${id}`);
  }
  suspendUser(id: string, reason: string) {
    return this.request(`/users/${id}/suspend`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    });
  }
  reinstateUser(id: string) {
    return this.request(`/users/${id}/reinstate`, { method: "PATCH" });
  }
  banUser(id: string, reason: string) {
    return this.request(`/users/${id}/ban`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    });
  }

  // Job / Listing Moderation
  listings(params: Record<string, string | number> = {}) {
    return this.request(`/listings${this.qs(params)}`);
  }
  listing(id: string) {
    return this.request(`/listings/${id}`);
  }
  moderateListing(id: string, decision: string, reason = "") {
    return this.request(`/listings/${id}/moderate`, {
      method: "PATCH",
      body: JSON.stringify({ decision, reason })
    });
  }

  // Dispute Resolution
  disputes(params: Record<string, string | number> = {}) {
    return this.request(`/disputes${this.qs(params)}`);
  }
  dispute(id: string) {
    return this.request(`/disputes/${id}`);
  }
  ruleDispute(id: string, winner: string, reason: string, action = "rule") {
    return this.request(`/disputes/${id}/rule`, {
      method: "PATCH",
      body: JSON.stringify({ winner, reason, action })
    });
  }
  escalateDispute(id: string, reason: string) {
    return this.request(`/disputes/${id}/escalate`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    });
  }

  // Audit Log
  audit(params: Record<string, string | number> = {}) {
    return this.request(`/audit${this.qs(params)}`);
  }
}

/**
 * Decode a JWT payload without verification (for display only).
 * The server re-verifies every request via requireAdmin.
 */
export function decodeToken(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export interface JwtPayload {
  sub: string;
  email?: string;
  role: string;
  [key: string]: unknown;
}
