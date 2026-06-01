## Objetivo

Trocar o diálogo "Novo caminhão" (que hoje pede placa+cliente+motorista de uma vez) por um **fluxo guiado de Etapa 1** que abre direto na tela de checklist, começando pela(s) placa(s). Ao concluir a etapa, a OS é aberta e o caminhão entra na tela de Etapas com Etapa 1 marcada como concluída — editável depois.

Toda a integração com UNO (buscar cliente por placa, buscar cliente por nome, cadastrar cliente) fica **estruturada e tipada agora, com implementação mockada**. Quando as APIs reais chegarem, basta trocar o corpo das funções em `src/lib/uno/*` — nenhuma mudança em componentes.

---

## 1. Botão "Novo caminhão" passa a iniciar Etapa 1 direto

- Remover o submit atual do `NewTruckDialog` (que já gravava placa/cliente/motorista).
- O botão agora cria um *truck rascunho* (sem placa, sem cliente, `stageId: 1`, sem OS) e navega para `/etapa/1/$truckId`.
- Alternativa equivalente: criar uma rota nova `/novo` que monta um truck rascunho e redireciona. Vou pelo caminho mais simples — criar rascunho no store + `navigate`.
- Store ganha `createDraftTruck()` retornando o `id` para o `navigate`.

## 2. Etapa 1 vira um wizard curto

A `STAGES[0]` (Recepção) deixa de ser uma lista plana de campos. Vira um wizard com **passos sequenciais dentro da própria página `/etapa/1/$truckId**`:

```text
Passo A  Tipo de veículo (1 / 2 / 3 placas)
Passo B  Placa 1 [, Placa 2, Placa 3]  — um input por placa
Passo C  Cliente (lookup por placa → confirma / troca / cadastra)
Passo D  Motorista + Indústria + Produto + cargas anteriores +
         sistema/produto de higienização + Anvisa + lote + posição na fila
```

- A `data/stages.ts` deixa de ditar a UI da Etapa 1 — ela passa a ser um componente próprio (`Stage1Wizard`), mas continua salvando os mesmos campos em `truck.checklists[1]` para preservar persistência e `isChecklistComplete`.
- Etapas 2/3/4 continuam usando o renderer genérico existente.
- O usuário pode revisitar Etapa 1 e editar qualquer passo (estado fica em `truck.checklists[1]`).

### Lookup de cliente por placa (Passo C)

Ao terminar de digitar a Placa 1 (botão "Buscar pela placa"):

1. Chama `buscarUltimoClientePorPlaca(placa)` (mock).
2. Mock devolve cliente fixo para `SEW-5H07`, `RKL-2D89`, etc; para placa nova → `null`.
3. Se retornar cliente: mostrar card "Último cliente atendido por essa placa: **{razão social}** — [Confirmar] [Trocar cliente]".
4. Se não retornar: mostrar bloco "Nenhum cliente encontrado. [Buscar cliente] [Cadastrar novo]".

### Buscar cliente (combobox)

- Componente `ClientePicker` (shadcn `Command` + `Popover`).
- Conforme digita, chama `buscarClientes(query)` com debounce 300ms (mock devolve lista filtrada).
- Itens: razão social (principal) + CNPJ formatado.
- Rodapé do popover: botão "+ Cadastrar novo cliente" → abre `NovoClienteDialog`.

### Cadastro rápido de cliente

`NovoClienteDialog` com 3 campos:

- Nome fantasia
- Razão social
- CNPJ (com máscara `00.000.000/0000-00` e validação simples de 14 dígitos)

Botão "Salvar" → `cadastrarCliente({ nomeFantasia, razaoSocial, cnpj })` (mock que retorna `{ id, razaoSocial, ... }` após 400ms) → seleciona automaticamente o cliente recém-criado no Passo C.

## 3. Fim da Etapa 1 → abre OS e vai para Etapas

- Botão final do wizard: "Abrir Ordem de Serviço".
- Habilita só quando: tipo de veículo + todas as placas + cliente selecionado + campos obrigatórios do Passo D.
- Ao clicar: chama `advanceStage(truckId)` (já abre a OS via lógica existente em `trucks.ts`) e navega para `/caminhao/$truckId`.
- Na tela de Etapas, Etapa 1 aparece como **Concluída** (já é o comportamento atual via `isChecklistComplete`), e ao clicar volta para o wizard em modo edição.

## 4. Camada UNO — tipada, mockada, plugável

Novos arquivos em `src/lib/uno/`:

- `clientes.ts`
  - `type Cliente = { id, razaoSocial, nomeFantasia, cnpj }`
  - `buscarUltimoClientePorPlaca(placa: string): Promise<Cliente | null>`
  - `buscarClientes(query: string, limit?): Promise<Cliente[]>`
  - `cadastrarCliente(input: { nomeFantasia; razaoSocial; cnpj }): Promise<Cliente>`

Cada função terá:

```ts
// TODO(UNO): substituir mock pela chamada real
// GET /cliente/by-placa/{placa}  → ajustar quando endpoint for definido
// return unoGet<Cliente>(`cliente/by-placa/${encodeURIComponent(placa)}`);
const USE_MOCK = true;
if (USE_MOCK) return mockBuscarUltimoClientePorPlaca(placa);
```

Mocks ficam em `src/lib/uno/clientes.mock.ts` com ~5 clientes fictícios e um mapa `placa → clienteId`. Quando as APIs chegarem, mudo `USE_MOCK=false` (ou removo o branch) e mantenho o restante.

A camada continua passando pelo `unoFetch` existente, então autorização (Bearer do localStorage / `VITE_UNO_DEV_TOKEN`) e tratamento de erro são reaproveitados.

## 5. Store — pequenas mudanças

- `addTruck` continua para compatibilidade (mock seed usa).
- Novo `createDraftTruck(): string` (retorna id) — cria truck sem placa/cliente/OS.
- Novo `updateTruck(id, patch: Partial<Pick<Truck,'placa'|'cliente'|'motorista'>>)` para o wizard gravar placa principal/cliente/motorista no nível do truck (além de `checklists[1]`).
- Bump da chave `persist`: `granlave-trucks-v9` para descartar estados antigos incompatíveis.

## 6. Arquivos afetados

- `src/components/NewTruckDialog.tsx` — vira botão simples "Iniciar Etapa 1" (sem dialog), cria draft + navega. Mantém o nome do arquivo/exports atuais.
- `src/data/stages.ts` — Etapa 1 marcada com flag `customRenderer: true` (ou checklist mínima só com os IDs que ainda quero persistir).
- `src/routes/etapa.$stageId.$truckId.tsx` — se `stageId === 1` renderiza `<Stage1Wizard />`, senão mantém renderer atual.
- `src/components/stage1/Stage1Wizard.tsx` (novo) — wizard com passos A→D.
- `src/components/stage1/ClientePicker.tsx` (novo).
- `src/components/stage1/NovoClienteDialog.tsx` (novo).
- `src/lib/uno/clientes.ts` (novo) + `src/lib/uno/clientes.mock.ts` (novo).
- `src/store/trucks.ts` — `createDraftTruck`, `updateTruck`, bump persist key.

## Fora de escopo

- Etapas 2/3/4 (sem mudanças).
- UI da listagem de "Últimas OSs" (sem mudanças).
- Autenticação UNO (segue como está).
- Validação completa de CNPJ (dígito verificador) — só máscara + 14 dígitos por enquanto.

## Observação

Você mencionou "Exemplo em anexo" para a tela de cadastro de cliente, mas os anexos atuais são screenshots de console/erros do UNO — nenhum mockup de tela. Vou implementar um dialog limpo com os 3 campos (Nome fantasia, Razão social, CNPJ) seguindo o padrão dos outros dialogs do projeto. Se você anexar o mockup depois, ajusto o visual.  
Desconsidere o anexxo, monte um cadadtro rapido com os dados ja combinados.