## Plano

A API `osq0001` retorna `codOs`, `nomeCliente`, `dtComprometida`, `codStatus`, `descAbrevStatus`, `nomeResponsavel`, `prioridade` — mas o mapper espera `numero`/`placa`/`cliente` (campos antigos/mock). Por isso os cards aparecem vazios.

### 1. `src/lib/uno/os.ts`
- Atualizar tipo `OS` para refletir o shape real: `codOs`, `codCliente`, `nomeCliente`, `nomeResponsavel`, `codResponsavel`, `dtComprometida`, `prioridade`, `descAbrevStatus`, `codStatus`. Manter campos legados como opcionais para retro-compat com mock.
- Reescrever `mapOSToCardData`:
  - `id` / `codOs` ← `String(os.codOs)`
  - `os` (label) ← `"OS-" + codOs`
  - `cliente` ← `os.nomeCliente ?? "—"`
  - `dataEmissao` ← `os.dtComprometida ?? os.dataEmissao ?? os.data`
  - `situacao` ← `os.descAbrevStatus ?? situacaoFromCodStatus(os.codStatus) ?? "—"`
  - Novos campos no `OSCardData`: `descStatus?: string`, `responsavel?: string`, `prioridade?: number`. `placa` torna-se opcional (não vem da lista).

### 2. `src/routes/index.tsx` — ajustar os 3 cards
Remover linha de placa (não existe no payload de lista) e mostrar campos que existem:

- **QueueCard** (fila): badge posição + `OS-{codOs}`, `{nomeCliente}` em destaque, rodapé com `{descAbrevStatus}` e data comprometida formatada (`dd/MM`). Tempo de espera continua via `dataEmissao`.
- **AtendimentoCard**: ícone caminhão + `OS-{codOs}` + `{nomeCliente}`. Bloco inferior passa a mostrar `{descAbrevStatus}` (badge) + `{nomeResponsavel}` + data comprometida. Mantém minutos.
- **ConcluidoCard**: ícone check + `OS-{codOs}` + `{nomeCliente}` + data comprometida + `{descAbrevStatus}`.

Adicionar helper local `formatData(iso)` → `dd/MM/yyyy` em pt-BR (ou `—` se vazio).

### Arquivos
- editado: `src/lib/uno/os.ts`
- editado: `src/routes/index.tsx`
