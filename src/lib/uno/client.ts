const UNO_API_BASE_URL = "http://192.168.1.19:8080/unoerp-api/";

export function getUnoToken(): string | null {
  if (typeof window !== "undefined") {
    const fromStorage = window.localStorage.getItem("token");
    if (fromStorage) return fromStorage;
  }
  const fromEnv = import.meta.env.VITE_UNO_DEV_TOKEN as string | undefined;
  return fromEnv && fromEnv.length > 0 ? fromEnv : null;
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = UNO_API_BASE_URL.endsWith("/") ? UNO_API_BASE_URL : `${UNO_API_BASE_URL}/`;
  return base + path.replace(/^\//, "");
}

export class UnoApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "UnoApiError";
    this.status = status;
    this.body = body;
  }
}

export async function unoFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getUnoToken();
  if (!token) {
    throw new UnoApiError(401, "Unauthorized (401): token ausente no localStorage");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(buildUrl(path), { ...init, headers });

  if (!res.ok) {
    let body: unknown = undefined;
    const text = await res.text().catch(() => "");
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }
    throw new UnoApiError(res.status, `UNO API ${res.status}: ${res.statusText}`, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const unoGet = <T = unknown>(path: string, init?: RequestInit) =>
  unoFetch<T>(path, { ...init, method: "GET" });

export const unoPost = <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
  unoFetch<T>(path, {
    ...init,
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const unoPut = <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
  unoFetch<T>(path, {
    ...init,
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const unoDelete = <T = unknown>(path: string, init?: RequestInit) =>
  unoFetch<T>(path, { ...init, method: "DELETE" });