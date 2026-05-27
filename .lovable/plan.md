
## Objetivo

Usar uma variável de ambiente `VITE_UNO_DEV_TOKEN` como fonte do token durante o desenvolvimento, mantendo o código **pronto para o deploy dentro do UNO**: em produção o token virá do `localStorage` e a variável de ambiente fica vazia / removida, sem precisar mexer no código.

## Estratégia

`getUnoToken()` passa a ter ordem de prioridade:
1. `localStorage.getItem("token")` — caminho oficial, que será o único usado quando a app rodar embarcada no UNO.
2. Fallback: `import.meta.env.VITE_UNO_DEV_TOKEN` — só popula em dev.

Assim, no dia do deploy, basta a variável estar ausente (ou vazia) e o comportamento volta a ser "lê do localStorage", exatamente como pedido. Nenhum `if (DEV)` condicional — a precedência natural já garante isso.

## Arquivos

### 1. `src/lib/uno/client.ts` (editar)
- Atualizar `getUnoToken()`:
  ```ts
  export function getUnoToken(): string | null {
    if (typeof window !== "undefined") {
      const fromStorage = window.localStorage.getItem("token");
      if (fromStorage) return fromStorage;
    }
    const fromEnv = import.meta.env.VITE_UNO_DEV_TOKEN as string | undefined;
    return fromEnv && fromEnv.length > 0 ? fromEnv : null;
  }
  ```
- Mantém `unoFetch` e o erro 401 imediato sem mudanças.

### 2. `src/vite-env.d.ts` (criar/ajustar)
- Tipar `VITE_UNO_DEV_TOKEN` para não dar erro de TS:
  ```ts
  /// <reference types="vite/client" />
  interface ImportMetaEnv {
    readonly VITE_UNO_DEV_TOKEN?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  ```
  (Se o arquivo já existe, só adiciona o campo.)

### 3. Secret no Lovable
- Adicionar `VITE_UNO_DEV_TOKEN` via `add_secret` (o usuário cola o JWT no formulário seguro).
- Importante avisar:
  - Por ter prefixo `VITE_`, o valor **vai parar no bundle do client** — não é segredo real, é só conveniência de dev.
  - JWT do UNO **expira**; quando expirar, atualizar via `update_secret` (gera novo build).

## Caminho até o deploy (sem mudança de código)

1. Antes do deploy embarcado no UNO: remover o secret `VITE_UNO_DEV_TOKEN` (ou deixar vazio).
2. A app passa a ler exclusivamente `localStorage.getItem("token")`, populado pela origem onde estiver servida.
3. Nenhuma alteração em `client.ts`, `os.ts` ou rotas.

## Observações

- Continuamos sem proxy server-side; chamada direta do browser ao `http://192.168.1.19:8080`. Mixed content / CORS seguem como limites do servidor UNO.
- Se mais tarde quisermos trocar para `postMessage` do UNO → iframe, a mudança fica isolada em `getUnoToken()`.
