## Liberar combo "Produto de higienização" antes da OS

Hoje o combo só carrega depois que a OS é aberta porque usa `listarProdutosReposicao(codOs, codAtendimento)`. Como o produto é o que será usado **para abrir** a OS, ele precisa estar disponível desde o início.

A fonte passa a ser o catálogo de produtos do UNO (`cadastro/cdq0201`), com filtros `isProduto=true&situacao=1`. A resposta já traz `codProduto`, `descComercial` e `un` — totalmente compatível com a shape `ProdutoHigienizacao` existente.

### Mudanças

**1. `src/lib/uno/produtos-higienizacao.ts`** — adicionar nova função `listarProdutosCatalogo`:
- Endpoint: `GET cadastro/cdq0201?isProduto=true&situacao=1&requiresCounts=true&page={n}&size={size}`
- Reaproveita `PageResponse<ProdutoHigienizacaoUno>` e `mapProduto` (os campos `codProduto`, `descComercial`, `un` já casam com o JSON de exemplo).
- Retorna `ProdutosPage` no mesmo formato de `listarProdutosHigienizacao`.
- Default `size: 100` para já trazer um lote utilizável no combo (paginação completa pode vir depois se necessário).
- Mantém suporte ao mock: se `isMockOn()`, delega para `mockListarProdutosHigienizacao` (reaproveita o mock existente — mesma shape).

Manter `listarProdutosHigienizacao` e `listarProdutosReposicao` intocadas (ainda usadas por `ProdutoHigienizacaoSearchDialog` e outras telas).

**2. `src/components/stage1/Stage1Wizard.tsx`**:
- Trocar import de `listarProdutosReposicao` por `listarProdutosCatalogo`.
- `carregarProdutos()`: sem parâmetros, chama `listarProdutosCatalogo({ page: 0, size: 100 })` e seta `resp.items`.
- `useEffect`: rodar uma única vez no mount (`[]`), sem depender de `truck.codOsErp` / `truck.codAtendimentoErp`. Continua respeitando `produtos.length === 0` como guard.
- Placeholder do Select: trocar `"Disponível após abrir a OS"` por `"Nenhum produto encontrado"` (fallback para lista vazia/erro). Mantém `"Carregando produtos..."` e `"Selecione um produto"`.
- Atualizar o comentário acima do estado de produtos para refletir que vem do catálogo, não do endpoint de reposição da OS.

Nada mais muda: validação obrigatória (`produto_higienizar`), bloqueio de troca de cliente após OS, e criação da OS apenas no clique "Abrir Ordem de Serviço" continuam como estão.