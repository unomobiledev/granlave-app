## Ajustes Etapa 1 - Recepção

### 1. Produto de higienização → combo simples (carregado da API)

**Nova função em `src/lib/uno/produtos-higienizacao.ts`**
- `listarProdutosReposicao(codOs, codAtendimento)` → `GET servico/osw0001/{codOs}/{codAtendimento}/reposicao`.
- Resposta: array de itens `{ produto: { codigo, descricaoComercial, indServico }, ... }`.
- Mapear para `ProdutoHigienizacao`: `id`/`codProduto` = `produto.codigo`, `descComercial` = `produto.descricaoComercial`, `un` = "".
- Adicionar mock equivalente em `produtos-higienizacao.mock.ts` (1-2 itens fixos).

**`src/components/stage1/Stage1Wizard.tsx`**
- Remover `ProdutoHigienizacaoPicker`.
- Substituir por `<Select>` (shadcn) que lista os produtos retornados, exibindo `descricaoComercial`.
- Carregar via `useEffect` chamando `listarProdutosReposicao(codOs, codAtendimento)` quando `truck.codOsErp` e `truck.codAtendimentoErp` existirem.
- Estado local: `produtos`, `loadingProdutos`, `produtosErro`.
- Ao selecionar, gravar `produto_higienizacao` (descricaoComercial) e `produto_higienizacao_id` (codigo) no checklist.

**Ponto a confirmar:** Hoje a OS só é criada no `handleAdvance` (fim da Etapa 1), então `codOs`/`codAtendimento` ainda não existem quando o usuário precisa preencher o combo. Opções:
- (a) Criar a OS mais cedo (ao confirmar o cliente) e então carregar o combo.
- (b) Usar um endpoint/lista genérica (ex.: `osw0008`) só para esse combo e, depois da OS criada, manter a referência.
- (c) Confirmar valores fixos default para o GET.

Vou seguir a opção (a) por default: mover `criarOS` para logo após o cliente ser confirmado (gera `codOsErp`/`codAtendimentoErp`), e o `handleAdvance` final só avança de etapa. Caso prefira outra, ajusto.

### 2. DDD + Telefone → campo único "Celular" com máscara

**`src/components/stage1/Stage1Wizard.tsx`**
- Remover os campos `ddd` e `telefone` separados.
- Novo campo **Celular** (`celular`) com máscara `(XX) XXXXX-XXXX`:
  - On-change: extrair dígitos (máx 11) e reformatar.
  - Persistir formatado em `celular` e dígitos brutos em `celular_digits`.
- Em `handleAdvance`/`criarOS`: derivar `ddd = digits.slice(0,2)`, `telefone = digits.slice(2)`, enviados apenas se houver 10 ou 11 dígitos.

### Fora do escopo
- Etapas 2+, busca de cliente, demais campos do passo C, remoção dos arquivos antigos `ProdutoHigienizacaoPicker/SearchDialog/NovoProdutoHigienizacaoDialog`.
