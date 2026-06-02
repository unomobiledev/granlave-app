# Ajustes UNO: status concluído + remover mock

## 1. Corrigir `codStatus` de CONCLUIDO

`src/lib/uno/os.types.ts`:
- `OS_COD_STATUS[CONCLUIDO]` passa de `[6]` para `[9]`.

## 2. Desligar mocks (usar API real)

Em todos os módulos `src/lib/uno/*`, trocar `USE_MOCK = true` por `USE_MOCK = false`:
- `src/lib/uno/os.ts` (listagens por status)
- `src/lib/uno/os-create.ts` (POST `servico/osf0001`)
- `src/lib/uno/os-detalhe.ts` (GET `servico/osw0001/{codOs}/null`)
- `src/lib/uno/clientes.ts` (se houver flag, deixar real)

A função `listarUltimasOS` já é real (sem flag) — sem mudanças.

## 3. Limpeza (opcional, seguro)

- Manter arquivos `*.mock.ts` no repo por enquanto (referência), mas remover imports não usados em `os.ts` se causarem warning. Caso contrário, deixar como está para reativar fácil em dev.

## 4. Verificação

- Home: três blocos (`AGUARDANDO_FILA=2`, `EM_ATENDIMENTO=3,4,5`, `CONCLUIDO=9`) batem no endpoint `servico/osq0001?codStatus={n}`.
- Criar OS no Stage1 chama POST real e usa `codOs`/`numero` retornados.
- Clicar num card abre `/os/$codOs` com GET real `servico/osw0001/{codOs}/null`.
- Erros 4xx/5xx aparecem no bloco de erro de cada seção (já implementado).

## Observação

O network log mostra `500` em `servico/osq0001` sem `codStatus`. Após esta mudança, as chamadas serão sempre com `codStatus={n}` (uma por código), o que deve resolver o 500 caso o backend exija o filtro. Se persistir, investigamos o payload de erro.
