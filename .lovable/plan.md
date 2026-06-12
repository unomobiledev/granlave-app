## Objetivo

Permitir avançar o `codStatus` da OS no UNO ERP a partir das telas de etapa:
- **Etapa 2 (Fila):** botão "Liberar para Higienização" (única ação).
- **Etapas 3+ (com checklist):** o botão "Avançar" passa a chamar o UNO (substitui o avanço local).
- **Finalização antecipada:** usa o mesmo endpoint passando `codStatus=6` (Concluída).

## Endpoint UNO

```
PUT servico/osk0001/{codOs}/{codAtendimento}?codStatus={novoCodStatus}
```
Sem body. O novo `codStatus` é o código da próxima situação cadastrada
(ou `6` para encerramento direto via finalização antecipada).

## Mudanças

### 1. Novo módulo `src/lib/uno/os-status.ts`
- `avancarStatusOS({ codOs, codAtendimento, novoCodStatus })` usando `unoPut` do `client.ts`.
- Comentário-cabeçalho com o CURL canônico (padrão dos outros arquivos `lib/uno/*`).
- Suporte a mock (no-op com delay) quando `isMockOn()`.
- Mesma função serve para avanço sequencial **e** para finalização antecipada
  (basta passar `novoCodStatus: 6`).

### 2. `src/routes/os.$codOs.etapa.$codSituacao.tsx`
- Calcular a **próxima situação** a partir da lista ordenada por `codigo`
  (primeira com `codigo > codigo atual`).
- `useMutation` chamando `avancarStatusOS`; em `onSuccess` invalidar
  `["uno","os","detalhe", codOs, codAtend]` e a key de listagem da home, e
  navegar de volta para `/os/$codOs`.
- **Etapa 2 (`isFila`):** substituir "Sem ações nesta etapa." por um botão
  grande **"Liberar para Higienização"** (rótulo usa `descAbrev`/`descricao`
  da próxima situação). Loading + toast de erro.
- **Etapas com checklist (codStatus ≥ 3):** adicionar abaixo do
  `<ChecklistItens>` um botão **"Avançar para {próxima etapa}"**, habilitado
  apenas quando checklist completo (via callback `onProgressChange` em
  `ChecklistItens`).
- **Finalização antecipada (etapas 2–5):** botão secundário
  **"Finalizar serviço"** (estilo âmbar, como hoje no `/etapa/...`) que abre o
  `FinalizarAntecipadoDialog` existente; ao confirmar, chama
  `avancarStatusOS({ novoCodStatus: 6 })`, invalida as mesmas keys e navega
  para `/os/$codOs`. Motivo/justificativa ficam só no UI (UNO ainda não
  recebe esses campos via esse endpoint — TODO documentado).
- Última etapa (sem próxima): ocultar avanço; manter finalização antecipada
  oculta quando já estiver em 6.

### 3. `src/components/os/ChecklistItens.tsx`
- Prop `onProgressChange?(done: number, total: number): void`, disparada em
  `useEffect` quando as respostas mudarem. Sem mudança visual.

### 4. Invalidações
- `["uno","os","detalhe", codOs, codAtend]` — reflete novo `codStatus` no
  header/etapas.
- Key da listagem da home (manter a existente).

## Fora do escopo
- Rota mock `/etapa/$stageId/$truckId` continua usando o store local.
- Sem mudanças nos cards da home.
