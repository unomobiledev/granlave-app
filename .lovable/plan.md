## Objetivo
Adicionar um interruptor global "Modo Mock" no header. Quando ligado, todas as chamadas à API UNO retornam dados de mockup; quando desligado, comportamento normal. Persistido entre sessões.

## Arquitetura

### 1. Estado global do toggle
**Novo `src/lib/uno/mock-mode.ts`**
- Hook `useMockMode()` baseado em Zustand, lendo/gravando `localStorage.granlave_mock` (`"on" | "off"`, default `"off"`).
- Função `isMockOn()` para leitura síncrona fora de componentes React.
- Helper `withMockFallback<T>(real: () => Promise<T>, mock: () => T | Promise<T>)`:
  - Se `isMockOn()` → retorna `mock()` direto (sem tocar a API).
  - Caso contrário → executa `real()`. (Sem fallback automático em caso de erro — controle é só pelo toggle, como pedido.)

### 2. Toggle no header
**`src/components/AppHeader.tsx`**
- Adicionar um `Switch` (shadcn) rotulado "Modo Mock" no canto direito, antes do `NewTruckDialog`.
- Quando ligado, exibir badge amarelo "MOCK" ao lado do título "Controle de Higienização".
- Ao alternar: chama `queryClient.invalidateQueries()` (via `useQueryClient`) para refazer fetches com a nova fonte.

### 3. Cobertura — todas as leituras passam por `withMockFallback`

| Arquivo | Função(ões) | Mock atual / a criar |
|---|---|---|
| `src/lib/uno/os.ts` | `listarOSsPorStatus` | `os.mock.ts` (existe) |
| `src/lib/uno/os-detalhe.ts` | `buscarOSPorCodigo` | criar mock em `os-detalhe.mock.ts` |
| `src/lib/uno/os-situacoes.ts` | `listarSituacoesOS` | criar mock em `os-situacoes.mock.ts` |
| `src/lib/uno/checklist-modelos.ts` | `listarModelosChecklist` | criar mock em `checklist-modelos.mock.ts` |
| `src/lib/uno/checklist-respostas.ts` | listagem de itens | criar mock |
| `src/lib/uno/clientes.ts` | listagem/busca de cliente | `clientes.mock.ts` (existe) |
| `src/lib/uno/produtos-higienizacao.ts` | listagem | criar mock simples |

Os mocks novos retornam 3–6 registros plausíveis, suficientes para navegar pelas telas (header da OS, etapas, checklist).

### 4. Remoção da flag antiga
- Apagar o `USE_MOCK = false` hardcoded em `os.ts`. A decisão passa a ser exclusivamente do toggle.
- `DEV_RESTRICT_OS_STATUS_1_6` permanece (escopo diferente).

## Detalhes técnicos

- O `withMockFallback` é chamado dentro de cada função pública dos módulos `uno/*`, mantendo a assinatura inalterada — nenhuma rota/componente precisa mudar.
- A persistência usa `localStorage` direto (não Zustand persist) para evitar problemas de SSR; `useMockMode` reidrata no mount via `useSyncExternalStore`.
- Cores do badge MOCK: `bg-amber-100 text-amber-800` (mesma paleta de "finalizado antecipadamente").

## Fora do escopo
- Editor visual dos mocks (são apenas constantes em código).
- Persistência de alterações feitas em modo mock (escritas continuam indo para a API real; se quiser bloquear, abrir nova tarefa).
