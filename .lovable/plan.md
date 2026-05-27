## Objetivo
1. Criar um cliente HTTP único para a API UNO ERP que lê o token do `localStorage` (chave `token`) e envia automaticamente como `Authorization: Bearer <token>` em toda chamada.
2. Buscar e exibir as últimas 10 OSs na home (`/`) usando esse cliente.

## Arquivos

### 1. `src/lib/uno/client.ts` — cliente fetch client-side
- Constante `UNO_API_BASE_URL = "http://192.168.1.19:8080/unoerp-api/"`.
- `getUnoToken()`: lê `localStorage.getItem("token")` com guarda `typeof window !== "undefined"` (não quebra SSR).
- `unoFetch<T>(path, init?)`:
  - Resolve URL relativa à base.
  - Lê token; se ausente → lança `Error("Unauthorized (401): token ausente no localStorage")`.
  - Mescla headers: `Authorization: Bearer <token>`, `Content-Type: application/json` (quando há body e o caller não definiu), mais headers passados pelo caller.
  - Em resposta não-ok, lança erro com status e corpo.
  - Retorna `response.json()` tipado.
- Helpers: `unoGet<T>`, `unoPost<T>`, `unoPut<T>`, `unoDelete<T>`.

### 2. `src/lib/uno/os.ts` — endpoints de OS
- `type OS = { id: ...; numero: ...; ... }` (tipagem mínima/flexível, campos opcionais — refinamos depois conforme o payload real).
- `listarUltimasOS(limit = 10)`:
  ```ts
  return unoGet<{ content: OS[]; totalElements?: number }>(
    `servico/osq0001?page=0&requiresCounts=true&size=${limit}`
  );
  ```
  Retorna o envelope paginado típico do Spring (`content`, `totalElements`).

### 3. `src/routes/index.tsx` — listagem na home
- `useQuery({ queryKey: ["uno", "os", "ultimas", 10], queryFn: () => listarUltimasOS(10) })`.
- Estados: loading (skeleton), erro (mensagem + botão "Tentar novamente"), vazio ("Nenhuma OS encontrada").
- Sucesso: tabela com as 10 últimas OSs usando `Table` do shadcn. Colunas iniciais: nº, data, cliente, situação (renderizadas de forma defensiva — se o campo não existir mostra `—`). Ajustamos os nomes exatos após ver o primeiro retorno real.

## Decisões
- **Chamada client-side direta** ao UNO, sem proxy. O token já vive no `localStorage` do browser.
- **URL como constante** no `client.ts` (não secret). Migra para `VITE_UNO_API_BASE_URL` se precisar variar por ambiente.
- **Sem token → 401 imediato** (lançado antes do fetch), conforme escolhido.
- **Sem refresh automático** do `refreshToken` nesta etapa.
- **TanStack Query** para a listagem (já presente no projeto), cache automático e retry desabilitado para erros 401.

## Observações
- Possível **mixed content** (HTTPS → HTTP `192.168.1.19`) e **CORS** se o UNO não liberar a origem do preview. São limites do servidor UNO; aparecerão como erro de rede. Solução, se ocorrer: trocar para proxy via server function — alteração isolada ao `client.ts`.
- Os nomes das colunas/campos da OS serão ajustados após a primeira resposta real, já que não temos o schema documentado aqui.