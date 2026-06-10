## Objetivo

Reformular a tela de detalhe da OS (`/os/$codOs`) para exibir os **status possíveis** como cards verticais (etapas virtuais do fluxo). Clicar em um card abre a **terceira tela** com o checklist daquele status.

O `codStatus` atual da OS determina visualmente o progresso:
- status `< codStatusAtual` → **Concluído** (verde/check)
- status `=== codStatusAtual` → **Em andamento** (destaque/primary)
- status `> codStatusAtual` → **Pendente** (cinza/bloqueado)

Premissa: como só se avança preenchendo o checklist da etapa, todos os anteriores são considerados concluídos por inferência (sem consultar respostas reais agora).

## Escopo restrito ao dev flag

Continua valendo `DEV_RESTRICT_OS_STATUS_1_6` — somente os status 1..6 entram na timeline.

## Mudanças

### 1. `src/routes/os.$codOs.tsx` — reformular `SituacoesSection`

Substituir o accordion atual (que abre o checklist inline) por **cards** com 3 estados visuais e clique navegando para a 3ª tela.

```text
┌─────────────────────────────────────────┐
│ ✓  Etapa 1 — Recepção         Concluído │
├─────────────────────────────────────────┤
│ ✓  Etapa 2 — Triagem          Concluído │
├─────────────────────────────────────────┤
│ ●  Etapa 3 — Lavagem        Em andamento│   ← clique abre checklist
├─────────────────────────────────────────┤
│ ○  Etapa 4 — Higienização       Pendente│
└─────────────────────────────────────────┘
```

Lógica de estado por etapa (`s.codigo` vs `data.codStatus`):
- `s.codigo < codStatusAtual` → `"concluido"`
- `s.codigo === codStatusAtual` → `"atual"`
- `s.codigo > codStatusAtual` → `"pendente"`

Cards `concluido` e `atual` são clicáveis (atual em destaque). Cards `pendente` ficam desabilitados (sem navegação) — opcional permitir abrir só leitura depois.

### 2. Nova rota: `src/routes/os.$codOs.etapa.$codSituacao.tsx`

Terceira tela = checklist da etapa selecionada. Recebe `codOs` (params), `codSituacao` (params) e `atend` (search, mantido do detalhe).

Conteúdo:
- Header com voltar para `/os/$codOs?atend=...`
- Título da etapa (busca em `listarSituacoesOS()` pelo `codigo`)
- Reaproveita o componente `ChecklistItens` já existente em `os.$codOs.tsx` (extrair para `src/components/os/ChecklistItens.tsx`)
- Resolve o modelo via `findModeloForSituacao(modelos, situacao)` (também extrair para `src/lib/uno/checklist-modelos.ts` como helper puro)

Persistência de respostas fica fora deste plano (já existe `checklist-respostas.ts` para futuro uso).

### 3. Extrações para evitar duplicação

- Mover `ChecklistItens` para `src/components/os/ChecklistItens.tsx`.
- Mover `findModeloForSituacao` para `src/lib/uno/checklist-modelos.ts`.
- Mover o cálculo da timeline para um helper `buildEtapas(situacoes, codStatusAtual)` em `src/lib/uno/os-etapas.ts`, retornando `{ situacao, estado: "concluido"|"atual"|"pendente" }[]`, já aplicando o dev flag.

### 4. Navegação

Card clicável usa `<Link to="/os/$codOs/etapa/$codSituacao" params={{ codOs, codSituacao: String(s.codigo) }} search={{ atend }}>`.

## Não faz parte deste plano

- Persistir respostas do checklist (próxima etapa).
- Validar de fato se cada etapa anterior foi concluída no backend (assumimos pela posição do `codStatus`).
- Mudar a home.
