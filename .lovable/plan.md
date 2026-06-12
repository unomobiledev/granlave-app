## Objetivo

Padronizar os rótulos das etapas para mostrar **"{codStatus} - {descrição vinda do UNO}"** em todos os lugares que hoje mostram só a descrição ou só "Etapa #N". A fonte da descrição continua sendo a API `cadastro/cdw0050` (situações cadastradas no UNO), restringida aos `codStatus` 1..6 (já filtrado por `DEV_RESTRICT_OS_STATUS_1_6`).

Referência funcional (não vira hardcode, é só documentação):
- 1 Recepção · 2 Veículo na fila · 3 Higienização · 4 Secagem · 5 Checklist final · 6 Finalizado

## Mudanças

### 1. Novo helper `src/lib/uno/os-situacao-label.ts`
Função única `formatSituacaoLabel(situacao)` que retorna `"{codStatus} - {descricao||descAbrev||descricaoAbreviada}"`, com fallback `"Etapa {codigo}"` quando nada vier. Usada por todas as telas para garantir formato consistente.

### 2. `src/routes/os.$codOs.etapa.$codSituacao.tsx`
- Título do cabeçalho: substituir o bloco `situacao.descricao ?? situacao.descAbrev ?? ...` por `formatSituacaoLabel(situacao)`.
- `proximaLabel` (botões "Liberar para..." / "Avançar para...") passa a usar `formatSituacaoLabel(proxima)`, mantendo o prefixo numérico.
- `nomeChecklist` passado ao `ChecklistItens` também usa o helper.

### 3. `src/routes/os.$codOs.index.tsx`
- Linha 119 (`situacao.descAbrev ?? situacao.descricaoAbreviada ?? situacao.descricao`) → `formatSituacaoLabel(situacao)`. Remove o `"Etapa #{codigo}"` redundante do cabeçalho (linha 190) já que o label já carrega o número, **ou** mantém o eyebrow "Etapa #N" e usa só a descrição abaixo — confirmar visualmente após implementação.

### 4. `src/routes/caminhao.$truckId.tsx`
- `situacao.descricao ?? situacao.descAbrev ?? ...` (linha 215 e 248) → `formatSituacaoLabel(situacao)`.

### 5. `src/routes/index.tsx` (home)
- Linha 296: `os.descStatus ?? \`Etapa ${etapa} de ${STAGES.length}\`` → se `os.codStatus` existir, mostrar `"{codStatus} - {descStatus}"`; senão manter fallback atual. Mantém os cards agrupados como estão.

### 6. `src/routes/configuracoes.checklist.tsx`
- Linha 106: aplicar o helper para consistência.

## Fora do escopo
- Sem mudanças no endpoint de status nem na lógica de avanço (`avancarStatusOS`).
- Sem alterar a ordem/filtragem (`DEV_RESTRICT_OS_STATUS_1_6` continua governando o que aparece).
- Sem hardcode dos nomes "Recepção/Fila/Higienização/Secagem/Checklist final/Finalizado": tudo continua vindo da API.
