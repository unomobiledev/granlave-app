## Redesign do popup "Selecionar cliente"

O diálogo atual fica pequeno, sem header visível, sem paginação evidente e parece travar quando carrega. Vou reconstruir com layout de 3 zonas (header fixo · corpo rolável · footer fixo de paginação) e ajustes de UX.

### Mudanças em `src/components/stage1/ClienteSearchDialog.tsx`

**Estrutura (DialogContent)**
- `max-w-5xl`, altura controlada (`h-[85vh]` / `max-h-[85vh]`), `p-0`, `overflow-hidden`, `flex flex-col` — para o corpo rolar sem empurrar header/footer.
- **Header fixo** (`border-b px-6 py-4 shrink-0`):
  - Título "Selecionar cliente" + subtítulo "Lista de clientes ativos no UNO ERP".
  - Linha de toolbar com:
    - Campo de busca com ícone (filtro local na página atual — razão social, fantasia e CNPJ; debounced 200ms). Nota explícita "filtra apenas a página atual" como helper text discreto.
    - Badge com total de clientes (`{totalElements}`).
    - Indicador "Atualizando…" com `Loader2` quando `isFetching && data` (mantém UI sem flicker via `keepPreviousData`).
- **Corpo rolável** (`flex-1 overflow-auto`):
  - Tabela com header sticky (`sticky top-0 bg-background z-10`).
  - Colunas: Código (mono, w-20), Razão social, Fantasia, CNPJ (mono), Cidade/UF, Ação (w-16, à direita).
  - Linhas com hover (`hover:bg-muted/50 cursor-pointer`) e clique na linha inteira seleciona o cliente (além do botão check). Botão de ação usa ícone `Check` em variant `ghost` com hover destacado.
  - Loading inicial (sem `data`): 10 linhas de `Skeleton` ocupando todas as colunas.
  - Erro: linha única com mensagem + botão "Tentar novamente".
  - Vazio: linha única "Nenhum cliente encontrado".
- **Footer fixo** (`border-t bg-muted/30 px-6 py-3 shrink-0`):
  - Esquerda: "Exibindo X–Y de N" (calculado a partir de `page`, `size`, `totalElements`).
  - Centro: Select com tamanhos de página (10 / 20 / 50 / 100) — atualiza `size` e zera `page`.
  - Direita: Paginação com botões "« Primeira", "‹ Anterior", indicador "Página X de Y", "Próxima ›", "Última »". Botões desabilitados nos extremos. Tudo em variant `outline size="sm"`.

**Lógica**
- Estados: `page`, `size`, `filter` (string debounced).
- `useQuery` com `queryKey: ["uno","clientes","page",page,size]`, `placeholderData: keepPreviousData`, `enabled: open`.
- Reset de `page` para 0 e de `filter` para "" sempre que `open` passa para `true` (efeito).
- Filtro local sobre `data.items` (matchea em `razaoSocial`, `nomeFantasia`, `cnpj`, case-insensitive). Cidade/UF lidos via paralelo `data.raw[i]`.
- Seleção: `onSelect(c)` + `onOpenChange(false)`.

### Sem mudanças em `ClientePicker.tsx`, `Stage1Wizard.tsx` ou `lib/uno/clientes.ts` — a API e o contrato do componente continuam iguais.

### Notas
- Busca textual continua client-side (apenas página atual) porque o `cdw0101` não tem param documentado de filtro. Quando o UNO expuser `q`/`nome`, é só trocar a fonte do filtro.
- O "travamento" reportado é mitigado por: `keepPreviousData` (não some a tabela ao trocar página), altura fixa do diálogo (sem reflow), e header/footer sticky (sempre visíveis).