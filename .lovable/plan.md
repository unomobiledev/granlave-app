## Ajustar nome do parâmetro: `codStatus` → `status`

A API UNO usa `status=` (não `codStatus=`). Os códigos numéricos permanecem os mesmos definidos em `OS_COD_STATUS`:

- Fila → `status=2`
- Em atendimento → `status=3`, `status=4`, `status=5` (3 chamadas paralelas)
- Concluído → `status=9`

### Mudanças

**`src/lib/uno/os.ts`** — em `listarOSsPorStatus`, trocar a querystring de cada chamada paralela:

```
servico/osq0001?page=0&requiresCounts=true&size={limit}&status={cod}
```

(antes era `&codStatus={cod}`)

Nada mais muda — o mapeamento `OS_COD_STATUS`, o fan-out em paralelo (1 chamada por código) e o `mapOSToCardData` continuam iguais.