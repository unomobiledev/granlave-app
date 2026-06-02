# Remover bloco "Últimas OSs (UNO ERP)"

## Mudanças

1. **`src/routes/index.tsx`**
   - Remover a `<section>` que renderiza `<UltimasOSSection />`.
   - Remover o componente `UltimasOSSection` e os helpers usados só por ele (`formatDate`, `formatCliente`).
   - Remover imports não mais usados: `listarUltimasOS`, `type OS`, `UnoApiError`, `Table/TableBody/TableCell/TableHead/TableHeader/TableRow`.
   - Manter os imports de `Skeleton`, `Card`, etc. que continuam usados pelos outros blocos.

2. **`src/lib/uno/os.ts`**
   - Manter `listarUltimasOS` exportada por enquanto (não custa nada e pode ser útil em outra tela), **ou** remover se você preferir limpeza total. Default do plano: **manter** (não há outros consumidores agora, mas é a única chamada "genérica" disponível).

## Resultado

Home passa a ter apenas 3 blocos, todos filtrados por `codStatus`:
- Fila → `codStatus=2`
- Em atendimento → `codStatus=3,4,5` (3 chamadas paralelas)
- Concluídos → `codStatus=9`

Nenhuma chamada a `servico/osq0001` sem `codStatus` será mais disparada pela home.
