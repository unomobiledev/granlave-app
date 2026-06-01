## Ajustes na Etapa 1 (Stage1Wizard)

### 1. Posição na fila automática

- Calcular próxima posição com base nos caminhões já no store (`useTrucksStore`).
- `nextPosicao = max(posicao_fila atuais) + 1` (ou `1` se vazio).
- Pré-preencher `posicao_fila` no rascunho quando ainda estiver vazio (campo continua editável no Passo D).

### 2. Reestruturar Passos B e C

**Passo B (placas + ações de cliente):**

- Após Tipo de veículo (Passo A), mostra inputs de placa (1/2/3) + dois botões:
  - `Buscar cliente pela placa` (usa `placa_1`)
  - `Buscar cliente manualmente`

**Passo C (renderização condicional):**

- Só aparece quando:
  - (a) Lookup pela placa encontrou cliente → card "Cliente vinculado" pré-preenchido (razão social, fantasia, CNPJ) com botão `Trocar`.
  - (b) Usuário clicou em `Buscar cliente manualmente` → `ClientePicker` aberto.
  - (c) Lookup pela placa falhou → mensagem "Nenhum cliente encontrado para esta placa" + `ClientePicker` aberto.
- Enquanto nada disso ocorrer, Passo C fica oculto.

**Passo D:** continua aparecendo só após `clienteOk`.

### 3. Estado interno do Wizard

- `clienteUiMode`: `'hidden' | 'lookup-found' | 'lookup-notfound' | 'manual'`.
- Handlers atualizam esse estado; `limparCliente` volta para `'manual'`.
- Se truck retomado já tem cliente, inicia como `'lookup-found'`.

### 4. Arquivos

- Único arquivo: `src/components/stage1/Stage1Wizard.tsx`.

---

## Finalização antecipada na Etapa 2

Alguns tipos de caminhão não passam por Secagem (Etapa 3) nem Liberação Final (Etapa 4). Na Etapa 2, o usuário poderá encerrar o serviço direto.

### 1. UI da Etapa 2

- Adicionar botão secundário **"Finalizar serviço"** ao lado do botão de avançar etapa, na tela `/etapa/2/$truckId`.
- Ao clicar, abre `FinalizarAntecipadoDialog` exigindo:
  - `Motivo` (select com opções pré-definidas: "Não requer secagem", "Não requer liberação final", "Solicitação do cliente", "Outro").
  - `Justificativa` (textarea, obrigatória, mínimo 10 caracteres).
- Botão `Confirmar finalização` só habilita quando motivo e justificativa válidos.

### 2. Store (`src/store/trucks.ts`)

- Estender `Truck` com:
  - `finalizadoAntecipado?: { etapa: number; motivo: string; justificativa: string; finalizadoAt: number }`.
- Nova action `finalizarAntecipado(truckId, { motivo, justificativa })`:
  - Move o truck de `trucks` para `completed`.
  - Marca `stageId` como a etapa em que foi finalizado (não avança para 3/4).
  - Salva o objeto `finalizadoAntecipado` no truck.
- Bump da chave de persist: `granlave-trucks-v10`.

### 3. Exibição

- Na listagem de "Últimas OSs" (concluídas), mostrar badge "Finalizado antecipadamente na Etapa X" quando `finalizadoAntecipado` presente.
- Na tela de detalhe do caminhão concluído, exibir o motivo + justificativa.
- Etapas 3 e 4 aparecem como "Não aplicável" (estilo `muted`, sem checks).

### 4. Arquivos afetados

- `src/store/trucks.ts` — tipo `Truck`, action `finalizarAntecipado`, bump persist.
- `src/components/stage2/FinalizarAntecipadoDialog.tsx` (novo).
- `src/routes/etapa.$stageId.$truckId.tsx` — renderizar o botão "Finalizar serviço aqui" só quando `stageId === 2`.
- `src/routes/caminhao.$truckId.tsx` — exibir badge/motivo nas etapas puladas.
- `src/routes/index.tsx` (listagem) — badge na seção de concluídos.

### Fora de escopo

- Permitir finalização antecipada em outras etapas (apenas Etapa 2 por enquanto).
- Edição posterior do motivo/justificativa.