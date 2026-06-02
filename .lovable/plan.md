## Ajustar códigos de status do UNO

Atualizar o mapa `OS_COD_STATUS` em `src/lib/uno/os.types.ts` para os códigos corretos do UNO:

- `AGUARDANDO_FILA` → `[1, 2]` (Recepção, Veículo na fila)
- `EM_ATENDIMENTO` → `[3, 4, 5]` (Higienização, Secagem, Liberação) — sem mudança
- `CONCLUIDO` → `[6]` (Finalizado) — era `[9]`

`src/lib/uno/os.ts` não muda — continua lendo o mapa e fazendo 1 chamada paralela por código via `&status={cod}` (fila passa a disparar 2 chamadas em paralelo).