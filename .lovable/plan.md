## Objetivo
Tornar todas as perguntas do checklist obrigatórias e bloquear o botão "Salvar" enquanto houver itens não respondidos.

## Mudanças em `src/components/os/ChecklistItens.tsx`

1. **Função `isRespostaCompleta(item, state)`**: valida cada item:
   - `tipoResposta === 1` (OK/NOK): `resposta` deve ser `"OK"` ou `"NOK"`; se `"NOK"`, `observacao` não vazia.
   - `tipoResposta === 3` (combo): `resposta` deve estar nas opções de `comboFixo`; se Sim/Não/N/A e `"Não"`, exigir `observacao`.
   - `tipoResposta === 2` (livre): `resposta.trim()` não vazia.

2. **Derivar `faltantes`** = itens cujo estado falha a validação.
   - `podeSalvar = faltantes.length === 0 && (!gravado || algumDirty)`.
   - Desabilitar botão "Salvar" conforme `podeSalvar`.

3. **Feedback visual**:
   - Rodapé: substituir mensagem por "Faltam N respostas" quando `faltantes.length > 0` (com singular/plural), em `text-destructive`.
   - Em cada `ChecklistItem` não respondido, exibir badge/asterisco discreto `*` ao lado da pergunta e borda `border-destructive/40` no `<li>` apenas quando o usuário já tentou salvar (ver passo 4) — para não "vermelhar" tudo na abertura.

4. **Estado `attemptedSave`** (boolean): ao clicar Salvar com faltantes, em vez de mutate, setar `attemptedSave = true` e mostrar `toast.error("Responda todos os itens obrigatórios")`. Resetar quando todos completos.

5. **Tooltip/title** no botão Salvar desabilitado: `"Responda todos os itens para salvar"`.

## Fora do escopo
- Validação no fluxo do `Stage1Wizard` (etapa Recepção) — somente o `ChecklistItens` (status ≥ 3).
- Mudança nos payloads de API.
