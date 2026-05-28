## Problema

Quando o UNO embute o app no iframe, ele aciona a URL `https://granlave-app.lovable.app/&0` (provavelmente um sufixo interno do ERP, tipo cache-buster ou flag). O TanStack Router não tem rota que case com `/&0`, então devolve **404**.

## Solução

Trocar o comportamento de "rota não encontrada" para **redirecionar silenciosamente para `/`** em vez de mostrar a tela de 404. Assim, qualquer sufixo bizarro que o UNO (ou qualquer outro contexto) acrescente cai sempre na home.

## Mudanças

**1. `src/routes/__root.tsx`**
- No `notFoundComponent` da rota raiz, em vez de renderizar a tela "404 Page not found", lançar um `redirect({ to: "/" })` via `useEffect` no client (ou usar `beforeLoad`/`loader` pattern equivalente).
- Implementação prática: componente que chama `useNavigate()` + `useEffect` pra `navigate({ to: "/", replace: true })` no mount, retornando `null` enquanto isso.

**2. (opcional) `src/router.tsx`**
- Garantir que `defaultNotFoundComponent` siga a mesma lógica, caso alguma rota interna dispare `notFound()` sem componente próprio.

## Fora de escopo

- Não vamos investigar/alterar a config do UNO agora (você escolheu redirecionar no app).
- Não mexe em token, CORS, nem nas chamadas à API do ERP.
- Não cria rotas novas; só muda o handler de 404.

## Como validar

Depois do build, abrir `https://granlave-app.lovable.app/&0` direto no navegador: deve redirecionar pra `/` e renderizar a home normalmente. Mesmo comportamento dentro do iframe do UNO.
