## Mudança

Em `src/routes/os.$codOs.tsx`, dentro de `SituacoesSection`, ajustar o filtro de etapas para exibir somente situações com `codigo` entre 1 e 6 (inclusive), mantendo a ordenação por `codigo` ascendente.

Antes:
```ts
const etapas = situacoes
  .filter((s) => s.indKanban !== false)
  .sort((a, b) => a.codigo - b.codigo);
```

Depois:
```ts
const etapas = situacoes
  .filter((s) => s.codigo >= 1 && s.codigo <= 6)
  .sort((a, b) => a.codigo - b.codigo);
```

Isso garante que o painel da OS exibirá apenas as 6 primeiras etapas (Recepção, Veículo na fila, Higienização, Secagem, Liberação do veículo, Finalizado), independente do flag `indKanban`.

## Arquivos

- editado: `src/routes/os.$codOs.tsx`
