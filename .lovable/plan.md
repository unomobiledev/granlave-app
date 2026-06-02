## Plano

### 1. Máscara nas placas
Criar helper `formatPlaca(value)` em `src/lib/format/placa.ts` que aceita formato Mercosul (`ABC1D23`) e antigo (`ABC1234`):
- Remove tudo que não é alfanumérico, uppercase, limita a 7 chars.
- Aplica máscara visual `ABC-1D23` (hífen após 3º char).
- Aplicar nos 3 `Input` de placa no `Stage1Wizard.tsx` via `onChange={(e) => setPlaca(idx, formatPlaca(e.target.value))}`.
- `maxLength={8}` (com hífen) e `inputMode="text"`.

### 2. Produto de higienização — vindo da API UNO
Novo módulo `src/lib/uno/produtos-higienizacao.ts`:
- `listarProdutosHigienizacao({ page, size })` → `GET servico/osw0008?requiresCounts=true&page={n}&size={size}`.
- `cadastrarProdutoHigienizacao(input)` → `POST cadastro/cdf0201` com payload conforme exemplo. Input mínimo do usuário: `codProduto`, `descComercial`, `descTecnica`, `un`, `classFiscalCodigo`. Demais campos com defaults (`tpAquisicao:1`, `situacao:1`, `indMateriaPrima:true`, `moeda:"R$"`, zeros e nulls como no exemplo).
- Tipo `ProdutoHigienizacao { id, codProduto, descComercial, un }` mapeado do response (campos a inspecionar — fallback genérico se shape variar).

Novo componente `src/components/stage1/ProdutoHigienizacaoPicker.tsx`:
- Estrutura igual ao `ClientePicker`: campo read-only mostrando produto selecionado + botão lupa que abre `ProdutoHigienizacaoSearchDialog` (mesmo padrão do `ClienteSearchDialog`: header com busca/total, tabela paginada server-side com `useQuery`+`keepPreviousData`, footer com paginação e page size).
- Botão secundário "Cadastrar novo produto" abre `NovoProdutoHigienizacaoDialog` com form simples (código, descrição comercial, descrição técnica, unidade, classe fiscal). Ao criar, faz `queryClient.invalidateQueries(['produtos-higienizacao'])` e seleciona automaticamente.

### 3. Integração no Stage1Wizard
- Substituir o `SelectField "Produto de higienização"` pelo `ProdutoHigienizacaoPicker`.
- Armazenar no checklist: `produto_higienizacao` (descrição comercial, mantém compat) + `produto_higienizacao_id` (codProduto).
- Validação `finalOk` permanece checando `produto_higienizacao`.

### Arquivos
- novo: `src/lib/format/placa.ts`
- novo: `src/lib/uno/produtos-higienizacao.ts`
- novo: `src/components/stage1/ProdutoHigienizacaoSearchDialog.tsx`
- novo: `src/components/stage1/ProdutoHigienizacaoPicker.tsx`
- novo: `src/components/stage1/NovoProdutoHigienizacaoDialog.tsx`
- editado: `src/components/stage1/Stage1Wizard.tsx`
