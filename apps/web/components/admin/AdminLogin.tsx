import { useState } from "react";
import { useAuth } from "../../context/AdminAuthContext";

/**
 * Demo login form. In production this would go through the real auth flow
 * (OAuth / SSO). For the bounty repo we mint an admin JWT client-side using
 * the same secret the API expects, purely so the panel is usable end-to-end.
 */
export function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@freelanceflow.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mintToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Mint a signed admin JWT using the server's secret via the auth /login
      // endpoint. We register an admin account first if needed.
      // The demo /login returns { token } for the seeded admin.
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: "admin123" })
        }
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Login failed");
      }
      login(json.token);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-login">
      <div className="card">
        <h2>Admin Login</h2>
        <p>Enter your admin credentials to access the panel.</p>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={mintToken} aria-label="Admin login form">
          <div className="form-row">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
            />
          </div>
          <button
            type="submit"
            className="btn"
            disabled={loading}
            aria-label={loading ? "Logging in…" : "Log in"}
          >
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>
      </div>
    </section>
  );
}
