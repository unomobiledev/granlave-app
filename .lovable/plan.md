
## Objetivo

Fazer a chamada às OSs funcionar quando o app roda dentro do UNO HTTPS (ex.: `https://prata14.unoerp.com.br/granlave-web/` → API em `https://prata14.unoerp.com.br/granlave-api/`), sem hardcode do IP local.

Observação importante do curl: o path da API **não** é `/unoerp-api/` — é `/granlave-api/`. Cada instalação UNO usa um nome diferente (granlave-api, unoerp-api, etc.), então o segmento precisa ser configurável.

## Estratégia de resolução da base URL (ordem)

1. **Query string** `?api=<url-completa>` — override explícito p/ debug.
2. **Origem do iframe pai** via `document.referrer` (ou `window.location.ancestorOrigins[0]`) + segmento de API. Como o referrer no exemplo é `https://prata14.unoerp.com.br/granlave-web/`, derivamos `https://prata14.unoerp.com.br/granlave-api/`.
3. **Env var** `VITE_UNO_API_BASE_URL` (build-time fallback).
4. **Default dev** `http://192.168.1.19:8080/unoerp-api/` (só quando rodando em localhost).

O **segmento da API** (`granlave-api` vs `unoerp-api` vs ...) também é configurável:
- Query `?apiPath=granlave-api`
- Heurística: substituir `-web` por `-api` no primeiro segmento do path do referrer (ex.: `/granlave-web/` → `/granlave-api/`). Cobre o padrão UNO atual.
- Env var `VITE_UNO_API_PATH` (default `unoerp-api`).

Resultado em cache em `sessionStorage` (`uno:apiBase`) para evitar recomputar.

## Mudanças

### Novo arquivo `src/lib/uno/api-base.ts`
- `resolveUnoApiBaseUrl(): string`
- `setUnoApiBaseUrlOverride(url: string | null): void` (debug)
- Lógica:
  1. Se `?api=` na URL → usa e cacheia.
  2. Se `sessionStorage['uno:apiBase']` → usa.
  3. Se `document.referrer` tem origem diferente de `window.location.origin` e é http(s) → `${referrerOrigin}/${apiPath}/` onde `apiPath` vem de `?apiPath`, ou da heurística `*-web → *-api` aplicada ao primeiro segmento do referrer, ou `VITE_UNO_API_PATH`, ou `unoerp-api`.
  4. Senão, `VITE_UNO_API_BASE_URL`.
  5. Senão, default dev `http://192.168.1.19:8080/unoerp-api/`.

### `src/lib/uno/client.ts`
- Remove a const `UNO_API_BASE_URL` hardcoded.
- `buildUrl()` passa a chamar `resolveUnoApiBaseUrl()`.
- Mantém token via `localStorage.token`, `Authorization: Bearer ...`.

### `src/components/UnoDevTokenBootstrap.tsx`
- Mostrar o `apiBase` resolvido no painel de debug.
- Botão "Resetar apiBase" (limpa `sessionStorage['uno:apiBase']`).
- Campo para override manual (chama `setUnoApiBaseUrlOverride`).

## Validação

- Acesso direto: `https://granlave-app.lovable.app/?api=https://prata14.unoerp.com.br/granlave-api` → deve listar OSs (depende de CORS no servidor UNO devolver `Access-Control-Allow-Origin` para a origem do Lovable).
- Embarcado em `https://prata14.unoerp.com.br/granlave-web/` via iframe → `document.referrer` resolve para `https://prata14.unoerp.com.br/granlave-api/` automaticamente. Network deve mostrar a chamada `same-origin` (sem mixed content, sem PNA).

## Fora de escopo

- Proxy server-side intermediando a chamada.
- Renovação automática de token.
- Configuração de CORS no servidor UNO (responsabilidade do backend; precisa permitir `authorization` no preflight e a origem do iframe).

## Notas técnicas

- `document.referrer` pode ficar vazio se o UNO usar `rel="noreferrer"` no iframe. Nesse caso caímos no `VITE_UNO_API_BASE_URL` ou no override por query. Documentar no painel de debug.
- A heurística `*-web → *-api` é simples e cobre `granlave-web/granlave-api`, `unoerp-web/unoerp-api`, etc. Se uma instalação fugir do padrão, o usuário usa `?apiPath=...` ou override manual.
