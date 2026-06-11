# Gravar, carregar e editar respostas do checklist

## Fluxo

No card de uma etapa (dentro do detalhe da OS):

1. Ao abrir o card, busca via `GET servico/osw0001/{codOs}/{codAtendimento}/checklist` os checklists já gravados desta OS/atendimento.
2. Para o `idModeloChecklist` da etapa atual, se houver checklist correspondente → pré-preenche respostas e guarda `idChecklist` + `idChecklistResposta` por pergunta.
3. Usuário edita as respostas. Botão **Salvar** no rodapé do card:
   - **Sem checklist ainda** → `POST cadastro/checklist` com payload completo.
   - **Checklist já existe** → para cada resposta marcada como `dirty`, `PUT servico/osw0001/{codOs}/{codAtendimento}/checklist/{codChecklistResposta}` com `{ resposta, observacao }`.
4. Após sucesso, invalida a query do GET para refletir o estado salvo.

## Mudanças

### 1. `src/lib/uno/checklist-respostas.ts`
- Tipos `ChecklistCreatePayload` e `RespostaItemPayload` espelhando o schema do POST (idModeloChecklist, nomeChecklist, situacao, dtInicio, dtFim, observacao, origem, codOportunidade, codOs, codAtendimento, codOcorrencia, resultado, respostas[]).
- Tipos `ChecklistGravado` / `RespostaGravada` para o GET.
- `criarChecklist(payload)` → `POST cadastro/checklist` (substitui o atual `criarRespostasChecklist`).
- `listarChecklistsDaOS(codOs, codAtendimento)` → `GET servico/osw0001/{codOs}/{codAtendimento}/checklist`.
- Manter `atualizarRespostaChecklist(codOs, codAtendimento, codChecklistResposta, { resposta, observacao })`.
- Mocks correspondentes (in-memory store que aceita POST/PUT e devolve no GET).

### 2. `src/components/os/ChecklistItens.tsx`
Refatorar para estado controlado:

- Props novas: `codOs`, `codAtendimento`, `codSituacao`, `nomeChecklist` (descrição do modelo).
- `useQuery` do `listarChecklistsDaOS` para hidratar estado inicial (encontra o checklist com `idModeloChecklist` igual ao da etapa).
- Estado local `Map<idModeloChecklistPergunta, { resposta, observacao?, idChecklistResposta?, dirty }>`.
- Cada `RespostaInput` recebe `value` + `onChange` (sem `useState` próprio).
- Botões no rodapé: **Salvar** e **Cancelar** (descarta para o último estado salvo).
- `useMutation`:
  - Criar: monta `ChecklistCreatePayload` e chama `criarChecklist`.
  - Atualizar: `Promise.all` de `atualizarRespostaChecklist` para itens `dirty`.
- `onSuccess`: `queryClient.invalidateQueries(["uno","checklist","os",codOs,codAtendimento])` + toast `sonner`.

### 3. Derivação dos campos do POST
- `idModeloChecklist`, `situacao=codSituacao`, `codOs`, `codAtendimento`: props.
- `dtInicio`: `new Date().toISOString()` no clique em Salvar; `dtFim`: `null`.
- `origem: 1`, `codOportunidade: 0`, `codOcorrencia: 0`, `resultado: 0`, `observacao: ""`.
- `nomeChecklist`: descrição do modelo.
- `codColaborador`: derivado do token JWT no `localStorage` (campo `codigo` do payload já presente no token) com fallback `0`.
- Mapeamento das respostas por `tipoResposta`:
  - `1` (bool) → `"OK"` / `"NOK"`.
  - `2` (livre) → string digitada.
  - `3` (combo) → string da opção escolhida.
- `respostas[i].observacao` só preenchida nos NOK/"Não".
- `respostas[i].dtResposta`: `new Date().toISOString()`.

### 4. Rotas que renderizam o checklist
`src/routes/os.$codOs.index.tsx` e `src/routes/os.$codOs.etapa.$codSituacao.tsx`: passar `codOs`, `codAtendimento` (do search), `codSituacao` e `nomeChecklist` para `<ChecklistItens />`.

### 5. Mock
Mantém um store em memória (`Map<codOs+codAtendimento, ChecklistGravado[]>`) para que POST/PUT/GET fiquem consistentes no modo mock.

## Fora do escopo
- Validação de obrigatoriedade (ex.: NOK sem observação trava o Salvar) — adiciono se quiser.
- Botão Finalizar etapa / mudar status da OS após salvar checklist.
