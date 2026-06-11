
## Objetivo

1. Substituir o "adivinhar modelo a partir da situação" por **de-para configurável** `codStatus` → `idModeloChecklist`.
2. Buscar e renderizar o checklist **somente quando o usuário clica no card da etapa dentro do detalhe da OS**, conforme `tipoResposta` real da API `cadastro/cdd0372`, agrupado por `grupoPergunta`.

## 1. De-para configurável Status → Checklist

**Estado atual:** `findModeloForSituacao()` em `checklist-modelos.ts` tenta casar `codSituacao`/`codStatus` com campos do modelo — frágil.

**Novo:** mapa explícito persistido em `localStorage` (`granlave_status_checklist_map`):

```ts
// src/lib/uno/status-checklist-map.ts
export type StatusChecklistMap = Record<number, number>; // codStatus -> idModeloChecklist
const DEFAULT_MAP: StatusChecklistMap = { 3: 1, 4: 2, 5: 3 };
```

API do módulo:
- `getStatusChecklistMap()` / `setStatusChecklistMap(map)`
- `useStatusChecklistMap()` — hook com `useSyncExternalStore` (padrão do `mock-mode`)
- `getChecklistIdForStatus(codStatus)`

**Tela de configuração:** nova rota `/configuracoes/checklist`, com link no `AppHeader`. Tabela das situações (`listarSituacoesOS()`); cada linha tem um `<Select>` com os modelos disponíveis (`listarModelosChecklist()`) + "— nenhum —". Botões "Salvar" e "Restaurar padrão".

## 2. Fluxo dirigido por clique no card da etapa

**Mudança principal:** a chamada `cadastro/cdd0372?idModeloChecklist=…` não acontece mais ao entrar na rota da etapa — ela só dispara quando o usuário clica num card de etapa **dentro do detalhe da OS** (`src/routes/os.$codOs.index.tsx`).

**Como:**

- Em `os.$codOs.index.tsx`, cada card de etapa vira interativo (botão/`<Card role="button">`). Estado local `etapaAberta: number | null` controla qual está aberta.
- Ao clicar, expandimos o próprio card (acordeão inline, sem navegar de rota) revelando o `<ChecklistItens idModeloChecklist={…} />` abaixo do cabeçalho do card. Só então `useQuery` dispara o fetch.
- A query continua sendo `itensChecklistQueryOptions(id)` em `ChecklistItens.tsx`, com `staleTime: 5 * 60_000` — ou seja, reabrir o mesmo card não refaz a chamada enquanto estiver fresco.
- Clicar de novo no card fechado/aberto faz toggle. Permitimos apenas um card aberto por vez (UX típica de acordeão); fácil de relaxar depois.
- O `idModelo` é resolvido via `getChecklistIdForStatus(situacao.codStatus)` no momento do clique. Se não houver mapeamento, mostramos uma mensagem "Nenhum modelo de checklist configurado para esta etapa — configure em Configurações › Checklist" (link).

**Rota `/os/$codOs/etapa/$codSituacao`:** continua existindo como fallback navegável (deep link / "abrir em tela cheia"), mas o detalhe da OS deixa de levar o usuário até ela por padrão. Botão "Abrir em tela cheia" opcional dentro do card aberto. *(Se preferir remover essa rota, fácil — basta avisar.)*

**Importante para o "não chamar antes do clique":** hoje a rota `etapa.$codSituacao` chama `ensureQueryData` no `loader` para situações/modelos, e o componente do checklist faz `useQuery` no render. Como a renderização do `ChecklistItens` agora é condicional ao `etapaAberta === codigo`, o `useQuery` só monta após o clique → fetch sob demanda.

## 3. Renderização do checklist por tipo de resposta

**Atualizar tipo** `ChecklistItemModelo` em `checklist-modelos.ts` para refletir o payload real:

```ts
type ChecklistItemModelo = {
  idModeloChecklistPergunta: number;
  idModeloChecklist: number;
  grupoPergunta?: string;
  pergunta: string;
  ordem: number;
  tipoResposta: 1 | 2 | 3;
  tipoRespostaDescricao?: string;
  descricao?: string;
  comboFixo?: string; // ex.: "Sim|Não|N/A"
};
```

**Render por tipo** em `ChecklistItens.tsx`:

- **`tipoResposta === 1`** (bool): botões `OK` (emerald) / `NOK` (destructive). Ao escolher `NOK`, abrir `<Textarea>` "Descreva a não conformidade" (comportamento atual).
- **`tipoResposta === 2`** (livre): `<Input>`. Heurística cosmética: enunciados começando com "Temperatura", "Tempo", "Número do lacre", "Resultado do" recebem `inputMode="decimal"`; resto é texto.
- **`tipoResposta === 3`** (combo `comboFixo`): grupo de botões segmentado a partir de `comboFixo.split("|").map(s => s.trim())`.
  - Se opções forem `Sim|Não` ou `Sim|Não|N/A` → estilizar como OK/NOK(/N/A), e tratar "Não" como gatilho do campo "Descreva a não conformidade".
  - Demais combos (`Aprovado|Reprovado|N/A`, etc.) → segmentado neutro com os rótulos da API.

**Agrupamento por `grupoPergunta`:** seções (`<section>`) com `<h3>` por grupo (Inspeção, Processo, Lacres, Carga, Não Conformidades), preservando `ordem` dentro do grupo. Itens sem grupo caem em "Geral".

**Descrição da pergunta:** mostrar `descricao` como `text-xs text-muted-foreground` abaixo do enunciado.

## 4. Mock alinhado

`checklist-modelos.mock.ts` passa a devolver perguntas com `tipoResposta` 1/2/3 + `comboFixo` + `grupoPergunta`, refletindo um subset do payload real para o "Modo mock" exercitar todos os caminhos de renderização.

## 5. Fora deste plano

Submissão/persistência das respostas (`checklist-respostas.ts`). Estado por item segue local (`useState`) até definirmos o endpoint de gravação.

## Arquivos tocados

- **novo:** `src/lib/uno/status-checklist-map.ts`
- **novo:** `src/routes/configuracoes.checklist.tsx`
- editar: `src/lib/uno/checklist-modelos.ts` (tipo + remover `findModeloForSituacao`)
- editar: `src/lib/uno/checklist-modelos.mock.ts` (tipos 1/2/3 + grupos)
- editar: `src/components/os/ChecklistItens.tsx` (render por tipo + agrupamento; query só roda quando montado)
- editar: `src/routes/os.$codOs.index.tsx` (cards clicáveis com acordeão; usa `getChecklistIdForStatus`)
- editar: `src/routes/os.$codOs.etapa.$codSituacao.tsx` (usa `getChecklistIdForStatus`; vira fallback de tela cheia)
- editar: `src/components/AppHeader.tsx` (link "Configurações")

## Detalhes técnicos

- Mapeamento é por `codStatus` (não `codigo`), como o usuário descreveu ("Status 3/4/5").
- Persistência local (`localStorage`) — coerente com `mock-mode`. Migra para endpoint no ERP quando/se existir cadastro próprio.
- `comboFixo` parseado uma vez por item com `useMemo`.
