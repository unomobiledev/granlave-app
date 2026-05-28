## Objetivo

Permitir configurar a URL base da API UNO via `.env` (em vez de UI), e fazer esse valor ter prioridade sobre a auto-detec\u00e7\u00e3o pelo referrer do iframe.

## Observa\u00e7\u00e3o importante sobre `.env` no Vite

Como este \u00e9 um app frontend (Vite), o `.env` \u00e9 lido **em build time**, n\u00e3o em runtime. Apenas vari\u00e1veis prefixadas com `VITE_` ficam dispon\u00edveis no bundle (`import.meta.env.VITE_*`). Ou seja, mudar o `.env` exige rebuild/reload do preview.

Isso n\u00e3o \u00e9 problema para o caso atual (cada instala\u00e7\u00e3o do app dentro de um UNO tem uma URL fixa), mas vale registrar.

## Mudan\u00e7as

### 1. `.env.example` (novo arquivo)
Documenta as duas vari\u00e1veis suportadas:
```
# URL base completa da API UNO (inclui o segmento, ex.: granlave-api)
# Quando definida, tem prioridade sobre a auto-detec\u00e7\u00e3o pelo iframe.
VITE_UNO_API_BASE_URL=https://prata14.unoerp.com.br/granlave-api/

# (Opcional) Apenas o segmento do path, usado quando a base \u00e9 derivada do referrer
# Default: unoerp-api. Heur\u00edstica *-web \u2192 *-api j\u00e1 cobre granlave-web/granlave-api.
# VITE_UNO_API_PATH=granlave-api
```

### 2. `src/lib/uno/api-base.ts`
Reordenar a resolu\u00e7\u00e3o para "manual sempre vence":

1. `?api=` (override de debug) \u2192 sessionStorage
2. `sessionStorage['uno:apiBase']` (cache de debug)
3. **`VITE_UNO_API_BASE_URL` (novo: sobe na prioridade)** \u2014 se setada no `.env`, vence a auto-detec\u00e7\u00e3o
4. `document.referrer` (auto-detec\u00e7\u00e3o do iframe pai)
5. Default dev (`http://192.168.1.19:8080/unoerp-api/`) em localhost
6. Fallback: mesma origem + `unoerp-api`

### 3. `.env.local` (criar se n\u00e3o existir)
N\u00e3o crio com valor real \u2014 fica a cargo do dev. Adicionar `.env.local` ao `.gitignore` se ainda n\u00e3o estiver (verificar).

## Fora de escopo

- UI de configura\u00e7\u00e3o em runtime (decidido: `.env`).
- Multi-tenant em runtime (um deploy = uma URL base fixa).

## Valida\u00e7\u00e3o

- Sem `.env` \u2192 comportamento atual (auto-detect via referrer, fallback localhost).
- Com `VITE_UNO_API_BASE_URL=https://prata14.unoerp.com.br/granlave-api/` no `.env.local` + restart do dev server \u2192 todas as chamadas v\u00e3o para essa URL, independente do referrer.
