## Refatorar Etapa 1 (Recepção) + criação real da OS

### Objetivo
1. Simplificar a Etapa 1: sem tipo de veículo, uma única placa, busca de cliente pelo `codItem` (mock por enquanto) com possibilidade do usuário trocar manualmente.
2. Ao salvar, chamar a API real de criação de OS no UNO (`POST servico/osf0001`) com o `codCliente` selecionado e os dados de contato do motorista.

---

### 1. `src/lib/uno/os.ts` (busca cliente por codItem)
Adicionar:
```ts
buscarUltimoClientePorCodItem(codItem: number | string): Promise<Cliente | null>
```
- Real: `GET servico/osw0001?codItem={codItem}` → pega `content[0].cliente` e mapeia para `Cliente`.
- Mock: devolve "UNO SOLUCOES INTEGRADAS" (codCliente=1) quando `codItem == 1`, senão `null`.

### 2. `src/lib/uno/clientes.ts` (placa → codItem, temporário)
`buscarCodItemPorPlaca(placa)` — mock que retorna sempre `1` até a API real ficar pronta. A busca/seleção/cadastro de cliente (`ClientePicker`, `ClienteSearchDialog`, `NovoClienteDialog`, `listarClientesPaginado`) **permanece inalterada**.

### 3. `src/lib/uno/os-create.ts` (ajustar payload conforme CURL real)
Endpoint segue `POST servico/osf0001`. Ajustes no payload atual:
- `tpOs`: `2` (era `1`).
- `categoria`: `"1 - HIGIENIZAÇÃO"` (era `"1 - MANUTENÇÃO CORRETIVA"`).
- `descricaoCategoria`: `"HIGIENIZAÇÃO"` (era `"MANUTENÇÃO CORRETIVA"`).
- Demais campos fixos mantidos: `qtd:1`, `codStatus:5`, `status:"5 - Não Iniciada"`, `codColaboradorImplant:1`, `codColaborador:1`, `codModalidade:1`, `codCategoria:1`, `codContato:1`, `origem:1`, `prioridade:5`, `codStatusDefeito:5`.
- `dtAbertura`, `dtPrevisaoConclusao`, `dtComprometida`: hoje em `YYYY-MM-DDT00:00:00` (mantido).
- Dinâmicos vindos da Etapa 1: `codCliente`, `nomeContato` (motorista), `ddd`, `telefone`.
- Remover `codOs:""` e `codAtendimento:""` do payload (não aparecem no CURL real).

Mapear resposta real (`{ codOs, codAtendimento, ... }`) para `OSCriada`:
- `codOs` = `resp.codOs`
- `numero` = `String(resp.codOs)` (não há campo `numero` separado)
- Expor também `codAtendimento` no retorno (necessário para `buscarOSPorCodigo(codOs, codAtendimento)`).

Mock atual (`isMockOn`) continua devolvendo `codOs` aleatório + `codAtendimento: 1`.

### 4. `src/components/stage1/Stage1Wizard.tsx`
- **Remover** `TIPO_VEICULO_OPTIONS`, `tipo_veiculo`, `placa_2`, `placa_3`, `placasCount`, `nPlacas` e o `StepCard A` de tipo de veículo.
- **Passo A — Placa única**: input `[A-Z0-9]` maiúsculo, sem máscara/hífen (sanitização local; `formatPlaca` segue intacto para outros usos), máx 7. Botão "Buscar cliente" → `buscarCodItemPorPlaca` → `buscarUltimoClientePorCodItem`.
  - Sucesso: pré-seleciona cliente (`cliente_id`, `cliente`, `cliente_fantasia`, `cliente_cnpj`).
  - Falha/`null`: abre `ClientePicker`.
- **Passo B — Cliente** sempre visível após a busca, com card "Cliente vinculado" + botão **Trocar** que abre o `ClientePicker` existente. Cliente pré-sugerido é apenas sugestão — usuário pode trocar e o `codCliente` usado na criação da OS passa a ser o selecionado.
- **Passo C — Dados da recepção**: campos atuais sem mudanças. Adicionar dois campos opcionais `ddd` e `telefone` no formulário (para popular o payload da OS); persistidos no checklist como `ddd` e `telefone`.
- `canAdvance = placa.length > 0 && clienteOk && finalOk` (removidos `tipoVeiculo` e validação multi-placa). `ddd`/`telefone` são opcionais.
- `handleAdvance`: chama `criarOS({ codCliente: Number(clienteId), nomeContato: motorista, ddd, telefone })`. Salva `codOs` e `codAtendimento` no truck (`updateTruck`) — adicionar `codAtendimento` ao tipo `Truck` se ainda não existir.

### Fora de escopo
- Etapas 2+.
- Endpoint real `buscarCodItemPorPlaca` (segue mock).
- Lógica/UI de busca de cliente — idêntica.

### Critérios de aceite
1. "Novo caminhão" pede apenas a placa.
2. Buscar com qualquer placa retorna o cliente mock como pré-selecionado.
3. **Trocar** abre o picker atual; a seleção substitui o cliente e o `codCliente` usado na criação da OS.
4. Sem resultado pelo `codItem`, o picker abre automaticamente.
5. "Abrir Ordem de Serviço" chama `POST servico/osf0001` com `tpOs:2`, `categoria:"1 - HIGIENIZAÇÃO"`, `codCliente` do cliente exibido e `nomeContato/ddd/telefone` do formulário; armazena `codOs` + `codAtendimento` no truck e avança para a Etapa 2.
