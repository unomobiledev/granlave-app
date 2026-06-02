## Seleção de Cliente: ícone de busca + popup paginado

Substituir o combo (`ClientePicker` com lista inline) por um botão/ícone de busca que abre um diálogo com a lista paginada de clientes vinda do UNO. Ao clicar no ícone de seleção da linha, o popup fecha e o cliente é setado.

### Endpoint
```
GET cadastro/cdw0101?page={n}&situacao=1&requiresCounts=true&size=20
```
Retorna `PageResponse<ClienteUno>` com `content`, `totalElements`, `totalPages`, `number`. Campos por item: `codCliente`, `nomeCliente` (fantasia), `razaoSocial`, `cnpj`, `tipo`, `cidade`, `siglaUf`.

### Mudanças

**`src/lib/uno/clientes.ts`**
- Tipos: `ClienteUno` (shape bruto do UNO) e `Cliente` (já existente: `id`, `razaoSocial`, `nomeFantasia`, `cnpj`).
- Adicionar `listarClientesPaginado({ page, size = 20 })` → chama o endpoint acima e devolve `{ items: Cliente[]; page: number; totalPages: number; totalElements: number }`, mapeando cada `ClienteUno` para `Cliente { id: String(codCliente), razaoSocial: razaoSocial ?? nomeCliente, nomeFantasia: nomeCliente ?? razaoSocial, cnpj: cnpj ?? "" }`.
- Remover `USE_MOCK` e o uso do mock em `buscarClientes` (a função pode ser removida — `ClientePicker` deixa de usá-la).
- Manter `buscarUltimoClientePorPlaca` e `cadastrarCliente` como estão (TODO endpoint real).

**`src/components/stage1/ClientePicker.tsx`** — refatorar para:
- Renderizar um campo "Cliente" somente-leitura mostrando o cliente selecionado (ou placeholder "Nenhum cliente selecionado") e um botão com ícone de lupa (`Search`) à direita que abre o diálogo.
- Manter as props atuais (`onSelect`, `autoFocus`) e adicionar `selected?: Cliente` para refletir o cliente já escolhido (opcional, retrocompatível).
- Manter o botão "Cadastrar novo cliente" abaixo, abrindo o `NovoClienteDialog` como hoje.

**`src/components/stage1/ClienteSearchDialog.tsx`** (novo) — diálogo paginado:
- Props: `open`, `onOpenChange`, `onSelect(cliente: Cliente)`.
- Estado: `page` (0-based). Usa `@tanstack/react-query` com `useQuery({ queryKey: ["uno","clientes","page", page], queryFn: () => listarClientesPaginado({ page }), placeholderData: keepPreviousData })`.
- UI:
  - Cabeçalho do diálogo: título "Selecionar cliente".
  - Tabela (shadcn `Table`) com colunas: Razão social, Fantasia, CNPJ, Cidade/UF, Ação.
  - Coluna "Ação" tem um botão ícone (`CheckCircle2` ou `Check`) que chama `onSelect(cliente)` e fecha o diálogo.
  - Rodapé: indicador "Página X de Y · N clientes" + botões Anterior/Próximo (desabilitados nos extremos). Loading state com `Skeleton` em algumas linhas; erro com mensagem + retry.
- Sem campo de busca textual nesta primeira versão (cdw0101 não documenta param de filtro). Fica como follow-up quando o UNO expuser `q`/`nome`.

**`src/components/stage1/Stage1Wizard.tsx`** — passar o `cliente` já selecionado para o `ClientePicker` via prop `selected` (apenas para o read-only field refletir a seleção). Nenhuma mudança de fluxo.

### Observação
- Paginação 100% server-side via `page=&size=20`, sem cache local agressivo (React Query cuida do cache por chave).
- 12k clientes no UNO: paginar é a abordagem correta; busca textual fica para quando a API suportar.