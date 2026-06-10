## Objetivo

Manter o card "Ordem de Serviço" (número, placa, cliente, status, categoria, abertura, previsão, contato, telefone) visível em **todas as telas internas da OS** — tanto na tela de etapas (`/os/$codOs`) quanto na tela de checklist de cada etapa (`/os/$codOs/etapa/$codSituacao`).

Hoje esse bloco só aparece em `os.$codOs.index.tsx`. Quando o usuário entra numa etapa, ele perde a referência da OS.

## Solução

Promover o bloco para o **layout pai** `src/routes/os.$codOs.tsx`, que já envolve as duas telas via `<Outlet />`. Assim ele fica fixo no topo (logo abaixo do `AppHeader`) em todas as sub-rotas da OS.

### Mudanças

1. **`src/routes/os.$codOs.tsx`** (layout pai)
   - Adicionar `validateSearch` para `{ atend: number }` (igual ao das filhas), já que precisaremos do `codAtendimento` para buscar a OS no layout.
   - Adicionar `loader` que faz `ensureQueryData` do `osDetalheQueryOptions`.
   - Substituir `component: () => <Outlet />` por um componente que renderiza:
     - `<AppHeader />`
     - Container `max-w-3xl` com:
       - Link "Voltar"
       - Card compacto da OS (mesmo conteúdo do bloco atual em `index.tsx`)
       - `<Outlet />` abaixo
   - Mover `AppHeader` para cá significa remover dos `errorComponent` / `notFoundComponent` repetições, mantendo o shell consistente.

2. **`src/routes/os.$codOs.index.tsx`**
   - Remover `AppHeader`, link "Voltar" e o Card "Ordem de Serviço" (agora vivem no pai).
   - Remover o `useSuspenseQuery(osDetalheQueryOptions)` daqui — passar o `codStatusAtual` via outra forma: o componente continua precisando, então mantemos o `useSuspenseQuery` (o cache já estará pré-aquecido pelo loader pai). Sem duplicação de rede.
   - Manter apenas: bloco debug (opcional, talvez remover), `SituacoesSection` (grid 3x2) e botão "Voltar ao painel".

3. **`src/routes/os.$codOs.etapa.$codSituacao.tsx`**
   - Remover `AppHeader` e o link "Voltar para a OS" do topo (o link voltar pode permanecer, agora apenas como navegação local acima do card de checklist).
   - Manter o card "Etapa #N" + checklist + botão voltar.

4. **Compartilhar `osDetalheQueryOptions`**
   - Extrair para `src/lib/uno/os-detalhe.queries.ts` (ou exportar do próprio `os-detalhe.ts`) para ser reusado pelo layout pai e pelo index.

## Fora do escopo

- Sem mudanças em dados/endpoints UNO.
- Sem mudança visual no `AppHeader` global.
- Sem alterar a grade 3x2 das etapas nem o checklist.
- Sem sticky/scroll behavior especial — o card simplesmente fica no topo do layout pai, presente em todas as sub-rotas.
