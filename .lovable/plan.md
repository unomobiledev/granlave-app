Hoje o token é lido do `localStorage` (`getUnoToken` em `src/lib/uno/client.ts`). Já existe um bootstrap dev (`UnoDevTokenBootstrap` + `getUnoDevToken`) que lê a secret `UNO_DEV_TOKEN` no servidor e grava no localStorage. Vamos aproveitar essa engrenagem, mas trocar a fonte da secret pelo `.env` local (`VITE_UNO_DEV_TOKEN`), pra você só colar o JWT lá e recarregar.

## Mudanças

1. **`.env`** — adicionar:
   ```
   VITE_UNO_DEV_TOKEN=<cole o JWT da Granlave aqui>
   ```
   (Sem aspas. Em prod/iframe do UNO, deixar vazio — o token vem do ERP via localStorage.)

2. **`.env.example`** — documentar a nova variável com instrução curta ("Apenas dev. Cole um JWT válido da instância alvo. Ignorado em produção quando o app roda dentro do ERP.").

3. **`src/lib/uno/dev-token.functions.ts`** — passar a ler `process.env.VITE_UNO_DEV_TOKEN` (com fallback no antigo `UNO_DEV_TOKEN` pra não quebrar quem já usa a secret). Continua retornando `{ token: string | null }`.

4. **`src/components/UnoDevTokenBootstrap.tsx`** — pequeno ajuste: sempre que o token do `.env` for diferente do que está no `localStorage`, sobrescrever (hoje só grava se estiver vazio). Assim, trocar o `.env` + reload já reflete sem precisar limpar o storage manualmente. Mantém no-op quando o server retorna `null`.

5. Nenhuma mudança em `client.ts` / `os.ts` — segue lendo `localStorage.token`, então em produção (dentro do iframe do UNO) o comportamento é idêntico.

## Como usar
1. Pegar um JWT válido da Granlave (logar no ERP dela, copiar `localStorage.token`).
2. Colar em `VITE_UNO_DEV_TOKEN=` no `.env`.
3. Reiniciar o dev server (Vite só relê `.env` no boot) e recarregar o preview.
4. A seção "Últimas OSs" deve passar do 500.

## Observações
- `VITE_*` fica embutido no bundle do client — ok pra dev, **não commitar** `.env` com token real. O `.gitignore` já cobre `.env`.
- Quando o app rodar embarcado no UNO em produção, deixe `VITE_UNO_DEV_TOKEN` vazio: o bootstrap vira no-op e o token real do ERP no `localStorage` é usado.
