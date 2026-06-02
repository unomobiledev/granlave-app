## Problema

O endpoint correto é `servico/osw0001/{codOs}/{codAtendimento}` (ex.: `/28/1`). Hoje `src/lib/uno/os-detalhe.ts` chama `/{codOs}/null`, o que retorna **UNO API 400**.

O `codAtendimento` vem da listagem `osq0001` (já presente no payload). Precisamos propagá-lo da home até a página de detalhe.

## Mudanças

### 1. `src/lib/uno/os-detalhe.ts`
- `buscarOSPorCodigo(codOs, codAtendimento)` → monta `servico/osw0001/{codOs}/{codAtendimento}`.
- `codAtendimento` obrigatório (number/string). Sem fallback para `null`.

### 2. `src/routes/os.$codOs.tsx`
- Aceitar `codAtendimento` via search param (`?atend=1`) usando `validateSearch`.
- Passar para `buscarOSPorCodigo` no `loader` e na `queryKey` (`["uno","os","detalhe", codOs, codAtendimento]`).
- Se `codAtendimento` ausente → mostrar erro amigável ("atendimento não informado").

### 3. `src/lib/uno/os.ts` (`OSCardData`)
- Adicionar `codAtendimento?: number` e preencher em `mapOSToCardData` a partir de `os.codAtendimento`.

### 4. `src/routes/index.tsx`
- Nos `<Link to="/os/$codOs">` dos 3 cards, incluir `search={{ atend: card.codAtendimento }}` (quando existir).

### Arquivos
- editado: `src/lib/uno/os-detalhe.ts`
- editado: `src/routes/os.$codOs.tsx`
- editado: `src/lib/uno/os.ts`
- editado: `src/routes/index.tsx`
