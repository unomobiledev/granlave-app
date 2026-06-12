## Layout dos campos de higienização e finais

Mudanças em `src/components/stage1/Stage1Wizard.tsx`:

1. **Sistema × Produto lado a lado**: remover o `sm:col-span-2` do `<div>` do "Produto de higienização" para que ele ocupe a coluna direita ao lado de "Sistema de higienização" no grid de 2 colunas existente.

2. **Anvisa / Lote combinados**: substituir os dois `<Field>` separados ("Registro Anvisa" e "Nº do lote") por um único campo composto, label "Registro Anvisa / Nº do lote", com dois `Input` lado a lado separados por uma `/` central. Cada input continua gravando em `anvisa` e `lote` respectivamente — a validação `requiredFinal` não muda.

3. **Posição na fila ao lado**: o `<Field>` de "Posição na fila" passa a ocupar a segunda coluna da mesma linha do campo composto Anvisa/Lote (grid de 2 colunas já existente). Sem `sm:col-span-2`.

Nenhuma lógica de negócio, estado ou validação é alterada — somente a estrutura visual dos campos no grid.