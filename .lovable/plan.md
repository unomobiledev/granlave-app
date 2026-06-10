## Objetivo

Na tela de detalhe da OS (`/os/$codOs`), exibir os 6 status como cards em uma grade de **3 colunas x 2 linhas** (semelhante à home), no lugar da lista vertical atual.

## Mudanças

**Arquivo único:** `src/routes/os.$codOs.index.tsx`

1. No componente `SituacoesSection`, trocar o stack vertical (`space-y-3`) por uma grade responsiva:
   - Mobile: 1 coluna
   - `sm`: 2 colunas
   - `lg`: 3 colunas (resultando em 3x2 com 6 etapas)
   ```tsx
   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
     {etapas.map(...)}
   </div>
   ```

2. Ajustar `EtapaCard` para ficar bem em formato de bloco (não mais linha horizontal larga):
   - Layout vertical interno: ícone no topo, "Etapa #N" como eyebrow, título, e badge de estado (`Concluído` / `Em andamento` / `Pendente`) no rodapé do card.
   - Manter as cores por estado já definidas (verde para concluído, primary para atual, opacidade reduzida + cadeado para pendente).
   - Manter `Link` para `concluido`/`atual` e `div` desabilitada para `pendente`.

## Fora do escopo

- Nenhuma mudança em dados, rotas, ou no filtro `DEV_RESTRICT_OS_STATUS_1_6` (continua limitando às 6 etapas).
- Sem mudanças na home nem na 3ª tela (checklist).
