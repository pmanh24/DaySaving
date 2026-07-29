export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiClientError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

interface RefreshData { accessToken: string; }

let currentAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
const tokenListeners = new Set<(token: string | null) => void>();

export function setApiAccessToken(token: string | null): void {
  currentAccessToken = token;
  tokenListeners.forEach((listener) => listener(token));
}

export function subscribeApiAccessToken(listener: (token: string | null) => void): () => void {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, { method: "POST", credentials: "include" })
    .then(async (response) => {
      const payload = (await response.json().catch(() => null)) as ApiEnvelope<RefreshData> | null;
      if (!response.ok || !payload?.data?.accessToken) return null;
      setApiAccessToken(payload.data.accessToken);
      return payload.data.accessToken;
    })
    .catch(() => null)
    .finally(() => { refreshPromise = null; });
  const token = await refreshPromise;
  if (!token) setApiAccessToken(null);
  return token;
}

async function sendRequest<T>(path: string, options: RequestInit, accessToken: string | null): Promise<{ response: Response; payload: ApiEnvelope<T> | null }> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, credentials: "include" });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  return { response, payload };
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  const requestToken = currentAccessToken ?? accessToken ?? null;
  let result = await sendRequest<T>(path, options, requestToken);
  const isAuthEndpoint = path.startsWith("/auth/");
  if (result.response.status === 401 && requestToken && !isAuthEndpoint) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) result = await sendRequest<T>(path, options, refreshedToken);
  }
  if (!result.response.ok) throw new ApiClientError(result.payload?.error?.message ?? "Không thể kết nối tới máy chủ.", result.response.status, result.payload?.error?.code);
  return (result.payload && "data" in result.payload ? result.payload.data : result.payload) as T;
}
