# Etapas dinâmicas no /caminhao/$truckId

Hoje a tela "Etapas do processo" do `/caminhao/$truckId` itera o array estático `STAGES` (4 etapas hardcoded em `src/data/stages.ts`). Vamos passar a montar a grade a partir das situações de OS cadastradas no UNO (`GET cadastro/cdw0050`), exatamente como já fazemos em `/os/$codOs` via `listarSituacoesOS`.

A carga das etapas é independente da OS (lista global de status). O conteúdo de cada card (progresso do checklist, "Concluída/Em andamento/Pendente") continua vindo da OS vinculada ao truck.

## Mudanças

### 1. Novo client UNO: `listarStatusOSCadastrados`
Arquivo: `src/lib/uno/status-os-cadastrados.ts`
- `GET cadastro/cdw0050?page=0&requiresCounts=true&size=60&sort=codigo,asc`
- Reusa `unoGet` (já injeta `Authorization` a partir do localStorage do ERP).
- Tipo `StatusOSCadastrado { codigo, codStatus?, descricao, descAbrev?, indKanban?, ... }` — mesmo shape de `OSSituacao`, mantendo compatibilidade com `buildEtapas`.
- Suporte a mock: se `isMockOn()`, devolve `mockListarSituacoesOS()` (já cobre 1..6).
- Respeita `DEV_RESTRICT_OS_STATUS_1_6` no consumidor (mesma lógica do `buildEtapas`).

> Mantemos `listarSituacoesOS` (osq0001/inicializar) intacto para não impactar a tela `/os/$codOs`. Se em uma rodada futura quisermos unificar, trocamos lá também.

### 2. `/caminhao/$truckId` passa a usar etapas do UNO
Arquivo: `src/routes/caminhao.$truckId.tsx`
- Adicionar `loader` com `ensureQueryData` da nova `statusOSQueryOptions` (queryKey `["uno","status-os","cdw0050"]`, `staleTime` 5 min).
- Se o truck tem `codOsErp`+`codAtendimentoErp`, também `ensureQueryData(osDetalheQueryOptions(...))` para obter `codStatus` atual.
- No componente:
  - `useSuspenseQuery(statusOSQueryOptions)` → lista de status.
  - Quando há OS vinculada: `useSuspenseQuery(osDetalheQueryOptions(...))` → `codStatusAtual`.
  - `buildEtapas(situacoes, codStatusAtual)` decide concluído/atual/pendente (já filtra por `DEV_OS_STATUS_ALLOWED`).
  - Renderizar um card por etapa, mantendo o visual atual (ícone, badge, descrição).
  - Para o caminhão **sem OS** (draft local, sem `codOsErp`): considerar todas as etapas pendentes exceto `codStatus = 1` como "atual" (igual ao comportamento atual do `stageId=1`).
- Link de cada card: se o truck tem OS no UNO, navegar para `/os/$codOs/etapa/$codSituacao?atend=...` (rota que já existe e trata Recepção como wizard). Sem OS no UNO, manter `/etapa/$stageId/$truckId` para o draft local (continua usando STAGES até a OS ser criada).
- Substituir `STAGES.map(...)` na grade. Manter `description` vinda de `situacao.descricao` (ou `descAbrev` como fallback).
- Progresso `checklist X/Y`: quando há OS no UNO, deixar "Checklist —" (sem números) por enquanto, pois os contadores vêm da OS via `ChecklistItens` (fora de escopo). Manter `checklistProgress(truck, stageId)` apenas para o fluxo draft.

### 3. Sem alterações em
- `src/data/stages.ts` (continua servindo o wizard local da Recepção até a OS existir no UNO).
- `src/store/trucks.ts` (truck local não muda).
- `/os/$codOs` (segue usando `listarSituacoesOS`).

## Critérios de aceite
- Acessando `/caminhao/<id>` de um truck adotado da OS UNO, os cards refletem as situações cadastradas no `cdw0050` (não os 4 fixos).
- Etapa atual destaca-se conforme `codStatus` da OS.
- Em mock mode, comportamento idêntico (6 etapas 1..6).
- `/os/$codOs` continua funcionando sem regressões.
