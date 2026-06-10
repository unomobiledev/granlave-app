## Objetivo
Deixar os cards da seção "Veículos em atendimento" maiores e mais imponentes no painel principal, já que normalmente haverá no máximo 4 simultaneamente.

## Mudanças

**`src/routes/index.tsx` — apenas `AtendimentoSection` / `AtendimentoCard`**

1. Grid: trocar `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` por `sm:grid-cols-2 xl:grid-cols-4` (sem o passo intermediário de 3 colunas), garantindo cards mais largos em telas médias e exatamente 4 colunas em telas grandes.
2. Card (`AtendimentoCard`):
   - Padding: `p-5` → `p-6`
   - Ícone do caminhão: `h-12 w-12` → `h-14 w-14`, `TruckIcon h-6 w-6` → `h-7 w-7`
   - OS (mono): `text-xs` → `text-sm`
   - Cliente: `text-base` → `text-lg`
   - Bloco de status (etapa/tempo): aumentar para `p-4` e `text-sm`, com a pílula da etapa em `text-sm`
   - Data comprometida: `text-[11px]` → `text-xs`
3. Não alterar Fila nem Concluídos.
4. Não alterar lógica/dados — somente apresentação.

## Fora do escopo
- Tela de detalhe da OS (header).
- Outras seções do painel.
