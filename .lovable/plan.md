# Cards de etapa por `codStatus` (revisado)

Comportamento dos cards do grid de etapas no detalhe da OS:

- **`codStatus === 1` (Recepção / cadastro da OS)** — card vira clicável; ao clicar, **navega para `/etapa/1/{truckId}`** (mesma tela do `Stage1Wizard`), só que com os dados da OS **já criada** carregados. **Não** expande accordion.
- **`codStatus === 2` (Na fila)** — card continua visível e clicável; ao expandir, mostra apenas `"Sem ações nesta etapa."`. Sem checklist, sem ações.
- **`codStatus >= 3`** — mantém o comportamento atual (`ChecklistItens` embutido + link "Abrir em tela cheia").

A diferença chave: status 1 é "formulário de cadastro da OS". No fluxo de **Novo caminhão** ainda não existe OS (`truck.os` vazio) e o wizard chama `criarOS` no final. Aqui, a OS já existe, então precisamos hidratar o `truck` local a partir do `OSDetalhe` e o wizard pula a chamada de criação (lógica que já existe: `if (truck.os) { advanceStage(...); navigate(...); return; }`).

## Mudanças

### 1. `src/store/trucks.ts`
Nova action:

```ts
getOrAdoptTruckForOS(osDetalhe): string
```

- Procura um truck com `os === String(osDetalhe.codOs)` ou `osCod === codOs`. Se existir, retorna o `id`.
- Caso contrário, cria um draft (`createDraftTruck`) e popula:
  - `os = String(osDetalhe.numero ?? osDetalhe.codOs)`
  - `cliente = nome do cliente` (string ou `cliente.razaoSocial`)
  - `placa = osDetalhe.placa ?? ""`
  - `motorista = osDetalhe.nomeContato ?? ""`
  - `stageId = 1`
  - `checklists[1]`: preenche `cliente_id` (do `codCliente`), `cliente`, `cliente_cnpj` se vier, `placa_1`, `motorista`. Demais campos ficam vazios para o usuário completar/editar.
- Persistir um campo extra opcional `codOsErp: number` no `Truck` para distinguir OSs vindas do ERP de drafts puramente locais (sem migração — campo opcional novo).

### 2. `src/routes/os.$codOs.index.tsx` (`EtapaCard`)
Refatorar para um switch por `situacao.codStatus`:

```tsx
const isRecepcao = situacao.codStatus === 1;
const isFila     = situacao.codStatus === 2;
```

- `isRecepcao`: o card inteiro é um `<button>` que dispara handler `abrirRecepcao()`:
  ```ts
  const truckId = getOrAdoptTruckForOS(data /* OSDetalhe */);
  navigate({ to: "/etapa/$stageId/$truckId", params: { stageId: "1", truckId } });
  ```
  Sem chevron, sem accordion, sem painel inferior. Mantém estilos `concluido/atual/pendente`. Como o `OSDetalhe` é necessário para hidratar, passar `osDetalhe` como prop do `SituacoesSection` para o `EtapaCard` (já temos via `useSuspenseQuery` na página).
- `isFila`: mantém o accordion atual; o painel expandido renderiza só `<p className="text-xs text-muted-foreground">Sem ações nesta etapa.</p>` (sem chamar `ChecklistItens`, sem link de tela cheia).
- Demais: comportamento atual inalterado.

### 3. `src/routes/etapa.$stageId.$truckId.tsx`
Sem mudança funcional. Como o `truck.os` virá preenchido para OSs adotadas do ERP, o `Stage1Wizard.handleAdvance` automaticamente pula `criarOS` e segue o fluxo de "OS já existe".

### 4. `src/routes/os.$codOs.etapa.$codSituacao.tsx` (rota de tela cheia)
Aplicar o mesmo switch: se `codStatus` da situação for `1`, redirecionar (`<Navigate>`) para `/etapa/1/{truckId}` usando `getOrAdoptTruckForOS`. Se for `2`, mostrar a mesma mensagem "Sem ações nesta etapa.".

## Fora do escopo
- Sincronizar de volta para o ERP os campos editados no `Stage1Wizard` (hoje só gravam no store local). Posso fazer num próximo passo se quiser — provavelmente um `PUT servico/osf0001/{codOs}` ou endpoint específico que você indicar.
- Pré-preencher mais campos do checklist da Recepção a partir do `OSDetalhe` (categoria, datas, etc.). Por ora só os essenciais (cliente, placa, motorista).
