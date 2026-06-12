## Corrigir status inicial da OS

A OS é criada com `codStatus: 5` / `status: "5 - Não Iniciada"` porque está hardcoded em `src/lib/uno/os-create.ts`. Deve ser status 2 (veículo na fila).

### Mudança em `src/lib/uno/os-create.ts`

No `payload` de `criarOS`:
- `status: "5 - Não Iniciada"` → `status: "2 - Veículo na Fila"`
- `codStatus: 5` → `codStatus: 2`
- `codStatusDefeito: 5` — **mantém** (não muda)

Nada mais é alterado.