# Corrigir erro "This page didn't load" no iframe do UNO

## Problema

O UNO carrega o iframe com a URL `https://granlave-app.lovable.app/&0`. Logs do worker confirmam: essa rota responde **404** no SSR. O redirect client-side via `useNavigate` no `NotFoundComponent` não funciona de forma confiável porque:

- No SSR o `useEffect` não roda — o servidor já manda 404.
- Na hidratação, o caminho de erro acaba caindo no `errorComponent` da raiz, que exibe o texto "This page didn't load".

## Solução

Tratar a URL **no Worker**, antes do TanStack processar a rota. Se o `pathname` não casar com nenhuma das rotas válidas (`/`, `/caminhao/...`, `/etapa/...`, `/_serverFn/...`, `/api/...`, assets), reescrever a request para `/` mantendo a query string. Isso evita o 404 totalmente.

## Mudanças

### 1. `src/server.ts`

Adicionar uma função `normalizeRequest(request)` que:

- Faz parse da URL.
- Testa o pathname contra uma allowlist (regex) das rotas reais:
  - `^/$`
  - `^/caminhao/[^/]+/?$`
  - `^/etapa/[^/]+/[^/]+/?$`
  - `^/_serverFn(/|$)`
  - `^/api(/|$)`
  - `^/assets(/|$)` e arquivos com extensão (`\.[a-z0-9]+$`) — favicon, css, js, imagens.
- Se nenhum match, cria uma nova `Request` apontando para `new URL('/', url.origin)` (preservando `search` se útil) e usa essa no `handler.fetch`.
- Caso contrário, segue normal.

Chamar `normalizeRequest` no início do `fetch` do `export default`, antes do try/catch existente.

### 2. `src/routes/__root.tsx`

Como o Worker agora resolve o caso, simplificar o `NotFoundComponent` de volta para um componente estático que apenas faz `<Navigate to="/" replace />` (defensivo). Isso só vai disparar em cenários muito raros (rota cliente-side não encontrada após navegação interna).

## Por que não outras abordagens

- **Só client-side redirect** (atual): falha porque o 404 SSR já dispara o errorComponent antes do redirect.
- **`notFoundMode: 'root'` no router**: muda o boundary, mas continua sendo 404 e ainda envolve hidratação delicada.
- **Rota splat `$.tsx`**: funcionaria, mas captura tudo (inclusive `/api/*`) e exige cuidado com prioridade — reescrever no Worker é mais limpo e isola o hack do UNO da árvore de rotas.

## Validação

Após implementar:
1. Acessar `https://granlave-app.lovable.app/&0` direto no navegador → deve renderizar a home com status 200.
2. Verificar logs do worker — não deve mais aparecer 404 para `/&0`.
3. Testar dentro do iframe do UNO.
