const CACHE_KEY = "uno:apiBase";
const DEFAULT_API_PATH = "unoerp-api";
const DEV_FALLBACK = "http://192.168.1.19:8080/unoerp-api/";

function normalize(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function readQueryParam(name: string): string | null {
  try {
    return new URL(window.location.href).searchParams.get(name);
  } catch {
    return null;
  }
}

function deriveApiPathFromReferrer(referrerUrl: URL, override: string | null): string {
  if (override && override.trim().length > 0) return override.replace(/^\/|\/$/g, "");
  const firstSeg = referrerUrl.pathname.split("/").filter(Boolean)[0];
  if (firstSeg && /-web$/i.test(firstSeg)) {
    return firstSeg.replace(/-web$/i, "-api");
  }
  const envPath = (import.meta as any).env?.VITE_UNO_API_PATH as string | undefined;
  return envPath && envPath.length > 0 ? envPath : DEFAULT_API_PATH;
}

function isLocalhost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

/**
 * Resolve a base URL da API UNO em runtime.
 * Ordem: ?api=... > sessionStorage > referrer (iframe pai) > VITE_UNO_API_BASE_URL > default dev.
 */
export function resolveUnoApiBaseUrl(): string {
  if (typeof window === "undefined") return DEV_FALLBACK;

  // 1. Override por query string
  const queryOverride = readQueryParam("api");
  if (queryOverride && isHttpUrl(queryOverride)) {
    const url = normalize(queryOverride);
    try {
      window.sessionStorage.setItem(CACHE_KEY, url);
    } catch {
      /* noop */
    }
    return url;
  }

  // 2. Cache de sessão
  try {
    const cached = window.sessionStorage.getItem(CACHE_KEY);
    if (cached && isHttpUrl(cached)) return normalize(cached);
  } catch {
    /* noop */
  }

  // 3. Env var de build (.env) — manual sempre vence a auto-detecção
  const envBase = (import.meta as any).env?.VITE_UNO_API_BASE_URL as string | undefined;
  if (envBase && isHttpUrl(envBase)) return normalize(envBase);

  // 4. Derivar do referrer (iframe pai)
  const referrer = document.referrer;
  if (referrer && isHttpUrl(referrer)) {
    try {
      const refUrl = new URL(referrer);
      if (refUrl.origin !== window.location.origin) {
        const apiPath = deriveApiPathFromReferrer(refUrl, readQueryParam("apiPath"));
        const base = normalize(`${refUrl.origin}/${apiPath}`);
        try {
          window.sessionStorage.setItem(CACHE_KEY, base);
        } catch {
          /* noop */
        }
        return base;
      }
    } catch {
      /* noop */
    }
  }

  // 5. Default dev (apenas em localhost)
  if (isLocalhost(window.location.hostname)) return DEV_FALLBACK;

  // Última opção: mesma origem + path default
  return normalize(`${window.location.origin}/${DEFAULT_API_PATH}`);
}

/** Sobrescreve manualmente a base URL (debug). Passe null para limpar. */
export function setUnoApiBaseUrlOverride(url: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (url == null) window.sessionStorage.removeItem(CACHE_KEY);
    else window.sessionStorage.setItem(CACHE_KEY, normalize(url));
  } catch {
    /* noop */
  }
}