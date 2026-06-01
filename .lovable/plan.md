## Resumo

Três ajustes:

1. **Etapa 1** — botão de busca ao lado do campo de placa.
2. **Tela inicial** — reordenar seções e adicionar bloco "Concluídos".
3. **Camada UNO** — cada bloco da home busca OSs por **status** via API (mock por enquanto), pronto para troca real.

---

## 1. Etapa 1 — `src/components/stage1/Stage1Wizard.tsx`

- Layout horizontal: input "Placa 1" (`flex-1`) + botão "Buscar cliente pela placa" alinhados na mesma linha.
- Para tipos com 2/3 placas, o botão fica ao lado da Placa 1. Placas 2 e 3 ficam abaixo, largura cheia.
- Botão "Buscar cliente manualmente" permanece abaixo, largura cheia.

---

## 2. Tela inicial — `src/routes/index.tsx`

Nova ordem dos blocos:

1. **Bloco 1 — Veículos na fila** → OSs UNO com status *Aguardando na fila*
2. **Bloco 2 — Veículos em atendimento** → OSs UNO com status *Em atendimento*
3. **Bloco 3 — Veículos concluídos (últimos 8)** → OSs UNO com status *Concluído* (novo bloco)
4. **Bloco 4 — Últimas OSs (UNO ERP)** → seção genérica já existente, mantida ao final

Cada bloco:
- `useQuery` próprio com `queryKey` por status.
- `Skeleton` em loading, card de erro em falha, `EmptyBlock` quando vazio.
- Cards do bloco 3 em estilo "concluído" (verde/muted), com badge "Finalizado antecipadamente na Etapa X" quando aplicável e link para `/caminhao/$truckId`.

> O store local (`useTrucksStore`) **continua existindo** apenas para o fluxo do wizard / etapas / finalização antecipada. A home passa a refletir o que vem da API UNO. Quando o usuário cria/avança/finaliza um caminhão, chamamos `queryClient.invalidateQueries(['uno','os'])` para refrescar os blocos.

---

## 3. Camada UNO por status — preparada para API, mock por enquanto

### Mapa status UNO ↔ etapa do sistema

| Bloco home               | Status UNO            | Etapa correspondente   |
|--------------------------|-----------------------|------------------------|
| 1 — Na fila              | `AGUARDANDO_FILA`     | (pré-Etapa 1)          |
| 2 — Em atendimento       | `EM_ATENDIMENTO`      | Etapas 1 → 4 em andamento |
| 3 — Concluídos           | `CONCLUIDO`           | pós-Etapa 4 (ou finalizado antecipado) |

Constante exportada em `src/lib/uno/os.ts`:

```ts
export const OS_STATUS = {
  AGUARDANDO_FILA: 'AGUARDANDO_FILA',
  EM_ATENDIMENTO:  'EM_ATENDIMENTO',
  CONCLUIDO:       'CONCLUIDO',
} as const;
export type OSStatus = typeof OS_STATUS[keyof typeof OS_STATUS];
```

> Os valores reais (string) virão do UNO. Hoje ficam como placeholders e a troca é centralizada nesta constante.

### Novas funções em `src/lib/uno/os.ts`

Mesma assinatura/estilo de `clientes.ts` (flag `USE_MOCK = true`, comentário `TODO(UNO):` com endpoint sugerido):

- `listarOSsPorStatus(status: OSStatus, opts?: { limit?: number }): Promise<OS[]>`
  - `TODO(UNO): GET servico/osq0001?situacao={status}&page=0&size={limit}` (endpoint a confirmar com UNO).
  - Quando `USE_MOCK`, delega para `os.mock.ts`.
- Conveniências:
  - `listarOSsNaFila()` → `listarOSsPorStatus('AGUARDANDO_FILA')`
  - `listarOSsEmAtendimento()` → `listarOSsPorStatus('EM_ATENDIMENTO')`
  - `listarOSsConcluidas(limit = 8)` → `listarOSsPorStatus('CONCLUIDO', { limit })`
- `listarUltimasOS` (já existe) — mantida como está para o bloco 4.
- `mapOSToCardData(os: OS)` — helper que normaliza o payload do UNO para o shape dos cards (`os`, `placa`, `cliente`, `dataEmissao`, `situacao`, `etapaAtual?`, `finalizadoAntecipado?`).

### Novo arquivo `src/lib/uno/os.mock.ts`

- 3 conjuntos de mocks coerentes (fila / atendimento / concluído), compatíveis com o tipo `OS`.
- `mockListarOSsPorStatus(status, opts?)` retorna a lista do status pedido com pequeno delay (~300ms), como em `clientes.mock.ts`.
- Inclui exemplo com `finalizadoAntecipado` para validar a badge no bloco 3.

### Consumo na home

Cada bloco usa `useQuery` próprio:

- `['uno','os','status','AGUARDANDO_FILA']` → `listarOSsNaFila()`
- `['uno','os','status','EM_ATENDIMENTO']` → `listarOSsEmAtendimento()`
- `['uno','os','status','CONCLUIDO', 8]` → `listarOSsConcluidas(8)`
- `['uno','os','ultimas', 10]` → `listarUltimasOS(10)` (bloco 4, inalterado)

### Quando a API real chegar

Trocar `USE_MOCK = false` em `os.ts`, ajustar os valores em `OS_STATUS` e o path/query em `listarOSsPorStatus` conforme contrato UNO. Nada na UI muda.

---

## Arquivos

- `src/components/stage1/Stage1Wizard.tsx` — layout horizontal placa + botão.
- `src/routes/index.tsx` — reordenação, novo bloco "Concluídos", todos os blocos via `useQuery` por status.
- `src/lib/uno/os.ts` — `OS_STATUS`, `listarOSsPorStatus` + conveniências, `mapOSToCardData`, flag `USE_MOCK`.
- `src/lib/uno/os.mock.ts` — **novo**, mocks por status.
