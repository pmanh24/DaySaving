"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { UserProfile } from "@saving/shared";
import { ApiClientError, apiRequest, setApiAccessToken, subscribeApiAccessToken } from "@/lib/api";

interface AuthResponse { user: UserProfile; accessToken: string; }

interface AuthContextValue {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, displayName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function restoreSession(): Promise<AuthResponse> {
  let lastError: unknown = new Error("Không thể khôi phục phiên đăng nhập.");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await apiRequest<AuthResponse>("/auth/refresh", { method: "POST" });
    } catch (error) {
      lastError = error;
      if (error instanceof ApiClientError && error.status === 401) throw error;
      if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 700 * (attempt + 1)));
    }
  }
  throw lastError;
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => subscribeApiAccessToken((token) => {
    setAccessToken(token);
    if (!token) setUser(null);
  }), []);

  useEffect(() => {
    void restoreSession()
      .then((session) => { setUser(session.user); setApiAccessToken(session.accessToken); })
      .catch(() => { setUser(null); setApiAccessToken(null); })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isLoading,
    async login(email, password) {
      const session = await apiRequest<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setUser(session.user);
      setApiAccessToken(session.accessToken);
    },
    async register(email, displayName, password) {
      const session = await apiRequest<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ email, displayName, password }) });
      setUser(session.user);
      setApiAccessToken(session.accessToken);
    },
    async logout() {
      await apiRequest<null>("/auth/logout", { method: "POST" }).catch(() => undefined);
      setUser(null);
      setApiAccessToken(null);
    },
  }), [accessToken, isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function AuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading && !user && !isAuthPage) router.replace("/login");
  }, [isAuthPage, isLoading, router, user]);

  if (isAuthPage) return children;
  if (isLoading || !user) return <main className="auth-loading"><div className="auth-card"><strong>Đang kiểm tra phiên đăng nhập…</strong><span>Vui lòng chờ một chút.</span></div></main>;
  return children;
}
