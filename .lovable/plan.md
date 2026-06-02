## Objetivo

Substituir o mock de listagem de OSs por chamadas reais ao endpoint `GET servico/osq0001`, filtrando por `codStatus` conforme o bloco da home:

| Bloco home              | `codStatus` |
|-------------------------|-------------|
| Veículos na fila        | `2`         |
| Veículos em atendimento | `3, 4, 5`   |
| Veículos concluídos     | `6`         |

A camada UNO continua reusável (mesmo padrão de `clientes.ts`/`os-detalhe.ts`), e a UI da home não muda — só passa a consumir dados reais.

## Mudanças

### 1. `src/lib/uno/os.types.ts`

Adicionar mapa de códigos numéricos do UNO e helper:

```ts
export const OS_COD_STATUS = {
  AGUARDANDO_FILA: [2],
  EM_ATENDIMENTO: [3, 4, 5],
  CONCLUIDO: [6],
} as const satisfies Record<OSStatus, readonly number[]>;
```

Mantém `OSStatus` (`AGUARDANDO_FILA | EM_ATENDIMENTO | CONCLUIDO`) como hoje — é o "status lógico" da UI; o `codStatus` é o detalhe de transporte UNO.

### 2. `src/lib/uno/os.ts`

- Substituir `listarOSsPorStatus` para:
  1. Pegar `codStatus[]` do `OS_COD_STATUS[status]`.
  2. Chamar `GET servico/osq0001?page=0&requiresCounts=true&size={limit}&codStatus={n}` — uma requisição por código (em `Promise.all`) e concatenar `content`. Justificativa: o CURL mostra que o endpoint aceita `codStatus` numérico simples; até confirmarmos suporte a `codStatus=3,4,5` ou repetição (`codStatus=3&codStatus=4&codStatus=5`), `Promise.all` é o caminho mais seguro e não muda a UI.
  3. Aplicar `slice(0, limit)` no resultado final para respeitar o `limit` da UI.
- Atualizar `mapOSToCardData` para entender também `codStatus` numérico vindo do UNO (descrição textual continua opcional).
- `USE_MOCK` continua `true` por padrão; a chamada real só roda quando virar `false` (igual hoje).

Pergunta em aberto (assumindo Promise.all como default): você sabe se o endpoint aceita `codStatus=3,4,5` (CSV) ou `codStatus=3&codStatus=4&codStatus=5` (repetido)? Se sim, troco para uma única chamada. Diga se quiser que eu chute uma das variantes em vez do Promise.all.

### 3. Mocks (`src/lib/uno/os.mock.ts`)

Adicionar `codStatus` numérico (2/4/6 — escolho 4 como representante do bloco "em atendimento") em cada `MockOS`, para o mock ficar coerente com o shape real e poder ser usado no `mapOSToCardData` sem ramos especiais.

### 4. Nada muda em

- `src/routes/index.tsx` — já usa `listarOSsNaFila` / `listarOSsEmAtendimento` / `listarOSsConcluidas`.
- Hooks/Query keys — continuam por `OSStatus` lógico.
- `os-detalhe.ts` e `os-create.ts` — fora de escopo.

## Verificação

1. Com `USE_MOCK=true`: home continua exibindo os 3 blocos com mocks (sem regressão visual).
2. Com `USE_MOCK=false` e token no `localStorage`: aba Network mostra `GET servico/osq0001?...&codStatus=2`, `...&codStatus=3`, `...&codStatus=4`, `...&codStatus=5`, `...&codStatus=6`. Cards renderizam os dados reais.
3. Erro de rede: `errorComponent` da home aparece, app não quebra.

## Fora de escopo

- Paginação real (continuamos com `page=0&size=limit`).
- Ordenação/filtros adicionais (placa, cliente, data).
- Troca do `USE_MOCK` para `false` por padrão — fica a seu critério.
