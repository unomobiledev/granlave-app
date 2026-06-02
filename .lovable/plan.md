## Objetivo

Conectar duas chamadas reais ao UNO ERP, reusáveis em toda a aplicação:

1. **POST `servico/osf0001`** — criar OS quando o usuário clica em **"Abrir Ordem de Serviço"** na Etapa 1.
2. **GET `servico/osw0001/{codOs}/null`** — buscar uma OS específica. Disparada ao clicar em qualquer card da home (fila, em atendimento, concluídos). Forma canônica para carregar detalhes de uma OS em qualquer lugar do app.

## Estrutura (camada UNO)

### 1. Novo arquivo `src/lib/uno/os-create.ts`

`criarOS(input)` monta o payload do CURL e chama `unoPost("servico/osf0001", payload)`. Mesmo padrão de `clientes.ts`/`os.ts` (com `USE_MOCK = true` por enquanto).

Entrada da UI:
```ts
type CriarOSInput = {
  codCliente: number;
  nomeContato: string;     // motorista
  ddd?: string;
  telefone?: string;
  dataAbertura?: Date;     // default hoje
};
```

Defaults fixos (espelham o CURL): `qtd:1, tpOs:1, status:"5 - Não Iniciada", codStatus:5, codColaboradorImplant:1, codColaborador:1, codModalidade:1, codCategoria:1, categoria:"1 - MANUTENÇÃO CORRETIVA", descricaoCategoria:"MANUTENÇÃO CORRETIVA", origem:1, codContato:1, codOs:"", codAtendimento:"", prioridade:5, codStatusDefeito:5`. Datas em `YYYY-MM-DDT00:00:00`.

Resposta tipada como `{ codOs: number | string; numero?: string | number; ... }`.

### 2. Novo arquivo `src/lib/uno/os-detalhe.ts`

`buscarOSPorCodigo(codOs)` → `GET servico/osw0001/{codOs}/null`. Mesmo padrão (`USE_MOCK`).

```ts
export async function buscarOSPorCodigo(codOs: string | number): Promise<OSDetalhe> {
  if (USE_MOCK) return mockBuscarOSPorCodigo(codOs);
  return unoGet<OSDetalhe>(`servico/osw0001/${encodeURIComponent(String(codOs))}/null`);
}
```

- Segundo segmento (`null`) mantido literal como no CURL — TODO documentar significado quando souber.
- Tipo `OSDetalhe` parte com `{ codOs, numero?, status?, codStatus?, cliente?, codCliente?, placa?, dtAbertura?, ...campos do payload do POST }` e fica `& Record<string, unknown>` para não quebrar enquanto o schema do UNO não está fechado. Refinamos conforme respostas reais.
- Mock devolve uma estrutura plausível baseada nos mocks de `os.mock.ts`, suficiente pra renderizar uma tela de detalhe.

### 3. `mapOSToCardData` em `src/lib/uno/os.ts`

Adicionar campo `codOs` (numérico/string original do UNO) em `OSCardData`, separado de `os` (formatado para display). Necessário para que o card saiba qual id passar para `buscarOSPorCodigo` ao navegar.

## UI

### 4. Etapa 1 — `Stage1Wizard.tsx`

Substituir `handleAdvance`:
1. Se `!truck.os`: setar `creating=true`, chamar `criarOS({ codCliente: Number(clienteId) || 1, nomeContato: motorista })`. Em sucesso → `updateTruck(truck.id, { os: String(resp.codOs) })`, depois `advanceStage` + navegar. Em erro → toast (`sonner`), permanecer.
2. Se já existe `truck.os`: mantém comportamento atual (sem chamada API).

Botão mostra `Loader2` enquanto `creating`.

### 5. Home — `src/routes/index.tsx`

Hoje `QueueCard`, `AtendimentoCard`, `ConcluidoCard` não navegam (têm `group block` mas sem `Link`). Envelopar cada um em `<Link to="/os/$codOs" params={{ codOs: String(os.codOs) }}>`.

### 6. Nova rota `src/routes/os.$codOs.tsx`

Rota de detalhe da OS. Loader segue o padrão canônico TanStack Query da knowledge base:

```ts
const osDetalheQueryOptions = (codOs: string) =>
  queryOptions({
    queryKey: ["uno", "os", "detalhe", codOs],
    queryFn: () => buscarOSPorCodigo(codOs),
  });

export const Route = createFileRoute("/os/$codOs")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(osDetalheQueryOptions(params.codOs)),
  component: OSDetalhePage,
  errorComponent: ({ error }) => <ErrorBlock error={error} />,
  notFoundComponent: () => <p>OS não encontrada.</p>,
});
```

Página renderiza um cabeçalho simples (`AppHeader` + card com nº, placa, cliente, status, dt abertura, contato). Como o schema de detalhe ainda não está fechado, layout é minimalista e usaremos `JSON.stringify` em uma seção colapsável "Raw UNO" para inspecionar campos extras durante desenvolvimento. Refinamos quando os campos reais chegarem.

Esta rota é a única consumidora hoje, mas `buscarOSPorCodigo` fica disponível para futuras telas (ex.: clicar em uma linha da tabela "Últimas OSs", abrir OS a partir da Etapa 4, etc.).

## Verificação

1. Botão "Abrir Ordem de Serviço" mostra spinner; com `USE_MOCK=true` cria OS local e avança.
2. Clicar num card da home navega para `/os/{codOs}` e mostra dados mock.
3. Com `USE_MOCK=false` e token UNO no `localStorage`: aparece `POST servico/osf0001` e `GET servico/osw0001/{codOs}/null` na aba Network.
4. Erro de rede em qualquer das duas chamadas: toast/`errorComponent` aparece, app não quebra.

## Fora de escopo

- DDD/telefone do contato (mandar vazio).
- Parametrização de categoria/modalidade/colaborador (hardcoded por enquanto).
- Layout final da página de detalhe — versão minimalista até o schema do UNO estar fechado.
- Edição/atualização de OS (PUT).

## Perguntas em aberto (assumindo defaults — diga se quiser diferente)

1. **codCliente**: quando virarmos para API real, o `Cliente.id` virá com o `codCliente` numérico do UNO? Se não, precisamos adicionar `codCliente: number` em `Cliente`.
2. **nomeContato / ddd / telefone**: ok usar `motorista` como `nomeContato` e deixar DDD/telefone vazios por enquanto?
3. **Segundo segmento `/null` em `osw0001/{codOs}/null`**: você sabe o que ele representa (filial? variante?) ou mantenho literal `null` até descobrirmos?
