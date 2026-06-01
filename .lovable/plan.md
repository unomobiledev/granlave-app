## Problema

A tela inicial está retornando 500 (SSR) com o erro:

```
TypeError: Cannot read properties of undefined (reading 'AGUARDANDO_FILA')
  at src/lib/uno/os.mock.ts:25
```

Causa: **dependência circular** entre `src/lib/uno/os.ts` e `src/lib/uno/os.mock.ts`.

- `os.ts` (linhas 2–5) importa `mockListarOSsPorStatus` de `./os.mock`
- `os.mock.ts` (linhas 1–2) importa `OS_STATUS` e `OSStatus` de `./os`

Como `os.ts` é avaliado primeiro e suspende em `import "./os.mock"`, o mock executa antes que `OS_STATUS` esteja definido — então `OS_STATUS.AGUARDANDO_FILA` lança `TypeError` no topo do módulo, derrubando toda a página.

## Correção

Quebrar o ciclo movendo as constantes/tipos de status para um arquivo neutro que não importa nada do `os.ts` nem do `os.mock.ts`.

### 1. Criar `src/lib/uno/os.types.ts`

Conterá apenas:
- `OS_STATUS` (objeto `as const`)
- `OSStatus` (tipo derivado)

Sem nenhum import de `client`, `os.ts` ou `os.mock.ts`.

### 2. Atualizar `src/lib/uno/os.ts`

- Remover a declaração local de `OS_STATUS` / `OSStatus`.
- Importar `OS_STATUS` e `OSStatus` de `./os.types`.
- Reexportar (`export { OS_STATUS, type OSStatus } from "./os.types"`) para manter a API pública estável — `index.tsx` e outros consumidores continuam importando de `@/lib/uno/os` sem alteração.
- Manter todo o resto (funções `listarOSsPorStatus`, `mapOSToCardData`, etc.) igual.

### 3. Atualizar `src/lib/uno/os.mock.ts`

- Trocar `import { OS_STATUS } from "./os"` por `import { OS_STATUS, type OSStatus } from "./os.types"`.
- Remover o `import type { OSStatus } from "./os"`.
- Nenhuma outra mudança — os dados mock continuam idênticos.

## Verificação

1. Logs do dev server limpos (sem mais `TypeError ... AGUARDANDO_FILA`).
2. A rota `/` renderiza os 4 blocos (Fila, Em atendimento, Concluídos, Últimas OSs) com os dados mock.
3. Nenhum import quebra em `index.tsx`, `caminhao.$truckId.tsx`, etc.

## Escopo

Mudança puramente estrutural (refator de imports). Nenhuma alteração de UI, comportamento, contrato de API UNO, status names ou store local.
