import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

// Allowlist de rotas reais do app. Qualquer pathname fora disso (ex.: `/&0`
// que o UNO ERP injeta no iframe) é reescrito para `/` antes do TanStack
// rotear, evitando 404 no SSR.
const KNOWN_PATH_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/caminhao\/[^/]+\/?$/,
  /^\/etapa\/[^/]+\/[^/]+\/?$/,
  /^\/_serverFn(\/|$)/,
  /^\/api(\/|$)/,
  /^\/assets(\/|$)/,
  /^\/_build(\/|$)/,
  /\.[a-zA-Z0-9]+$/, // arquivos com extensão (favicon.ico, css, js, png...)
];

function normalizeRequest(request: Request): Request {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return request;
  }

  if (KNOWN_PATH_PATTERNS.some((re) => re.test(url.pathname))) {
    return request;
  }

  const rewritten = new URL("/", url.origin);
  return new Request(rewritten.toString(), request);
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const normalized = normalizeRequest(request);
      const response = await handler.fetch(normalized, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
