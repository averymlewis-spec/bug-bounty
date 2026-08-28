import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode
} from "react";
import { AdminAPI, decodeToken, JwtPayload } from "../lib/adminApi";

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "freelanceflow_admin_token";

interface AuthContextValue {
  token: string | null;
  user: JwtPayload | null;
  login: (token: string) => void;
  logout: () => void;
  api: AdminAPI | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
  );

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const login = (newToken: string) => setToken(newToken);
  const logout = () => setToken(null);

  const api = token ? new AdminAPI(token) : null;
  const user = decodeToken(token);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
