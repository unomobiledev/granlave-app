# Corrigir tela branca no iframe do UNO

## Causa raiz

O UNO injeta no iframe URLs como `https://granlave-app.lovable.app/&1` (confirmado: `<iframe id="uno-iframe" src=".../&1">`).

A correção anterior em `src/server.ts` (`normalizeRequest`) faz **rewrite silencioso** dessas URLs para `/` antes do TanStack rotear. Resultado:

- Servidor responde **200** com o HTML SSR da home (verificado via curl).
- **Mas a URL na barra do navegador continua `/&1`**.
- Na hidratação, o TanStack Router compara a árvore SSR (gerada para `/`) com a rota do cliente (`/&1` — que não casa com nenhuma rota) → falha silenciosa → **tela branca** dentro do iframe.

Acessando direto em uma aba (URL `/` pura, sem `&1`) funciona normal — o que confirma que o app está OK e o bug é só na combinação rewrite + hidratação com URL "estranha".

## Solução

Trocar o **rewrite** por um **redirect HTTP 302** para `/`. Assim o navegador atualiza a URL real para `/`, o iframe recarrega em `/` limpo, a hidratação bate e o app renderiza.

## Mudanças

### `src/server.ts`

Substituir a função `normalizeRequest(request)` (que retorna uma `Request` reescrita) por uma checagem que, quando o pathname não casa com a allowlist, retorna direto uma `Response` 302:

```ts
function maybeRedirectUnknownPath(request: Request): Response | undefined {
  let url: URL;
  try { url = new URL(request.url); } catch { return undefined; }

  // Só GET/HEAD — outros métodos seguem normal
  if (request.method !== "GET" && request.method !== "HEAD") return undefined;

  if (KNOWN_PATH_PATTERNS.some((re) => re.test(url.pathname))) return undefined;

  // Redirect 302 para a raiz preservando search se existir
  const target = new URL("/", url.origin);
  return new Response(null, {
    status: 302,
    headers: { Location: target.toString(), "Cache-Control": "no-store" },
  });
}
```

No `fetch` do `export default`, chamar antes do `handler.fetch`:

```ts
export default {
  async fetch(request, env, ctx) {
    const redirect = maybeRedirectUnknownPath(request);
    if (redirect) return redirect;
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
```

Remover a função antiga `normalizeRequest` e a chamada correspondente.

### `.lovable/plan.md`

Atualizar a seção "Solução" do plano antigo explicando a mudança de rewrite → redirect e o motivo (hidratação cliente).

## Validação

1. `curl -sI "https://granlave-app.lovable.app/&1"` → deve retornar **302** com `Location: https://granlave-app.lovable.app/`.
2. Abrir o UNO → iframe deve seguir o redirect para `/` e renderizar a home normalmente.
3. `curl -sI https://granlave-app.lovable.app/` continua 200 (rota válida não redireciona).
4. `curl -sI https://granlave-app.lovable.app/caminhao/abc` continua 200.

## Por que não outras abordagens

- **Manter rewrite + tentar consertar hidratação**: o router cliente não tem como adivinhar que `/&1` deveria casar com `/` — seria necessário replicar a allowlist no cliente também, dobrando complexidade.
- **Rota splat `$.tsx` que faz `<Navigate to="/" />`**: funcionaria mas atrasa a renderização (precisa baixar JS, hidratar, navegar). Redirect HTTP é instantâneo.
- **Pedir ao time do UNO para corrigir o iframe**: fora do nosso controle.
