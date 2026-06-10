# Plano: OS → Situações → Checklist

## Mapeamento dos endpoints UNO


| #   | Operação                                   | Método | Endpoint                                                                    |
| --- | ------------------------------------------ | ------ | --------------------------------------------------------------------------- |
| 1   | Lista de OSs (já existe)                   | GET    | `servico/osq0001?page=0&size=N`                                             |
| 2   | Detalhe de uma OS (já existe)              | GET    | `servico/osw0001/{codOs}/{codAtendimento}`                                  |
| 3   | **Situações (etapas) disponíveis para OS** | GET    | `servico/osq0001/inicializar`                                               |
| 4   | **Modelos de checklist** (1 por situação)  | GET    | `cadastro/cdw0372?page=0&size=N`                                            |
| 5   | **Itens do modelo de checklist**           | GET    | `cadastro/cdd0372?idModeloChecklist={id}`                                   |
| 6   | **Gravar respostas do checklist** (criar)  | POST   | `servico/osd0005` — body `[{ id, resposta, observacao }]`                   |
| 7   | **Atualizar resposta individual**          | PUT    | `servico/osw0001/{codOs}/{codAtendimento}/checklist/{codChecklistResposta}` |


Resposta da pergunta do usuário: **não são 3, são 4 chamadas GET** para montar a tela (detalhe da OS + situações + modelos + itens), mais 2 endpoints de gravação (POST inicial e PUT por item).

## Mudanças

### Novo: `src/lib/uno/os-situacoes.ts`

- `listarSituacoesOS()` → GET `servico/osq0001/inicializar`. Retorna lista de situações (etapas) com `codSituacao`, `descricao`, `ordem`, `idModeloChecklist` (TODO confirmar campo real após primeira chamada).

### Novo: `src/lib/uno/checklist-modelos.ts`

- `listarModelosChecklist({ size? })` → GET `cadastro/cdw0372`.
- `listarItensModeloChecklist(idModeloChecklist)` → GET `cadastro/cdd0372?idModeloChecklist={id}`.
- Tipos: `ChecklistModelo`, `ChecklistItem` (id, descrição, tipo de resposta, obrigatório).

### Novo: `src/lib/uno/checklist-respostas.ts`

- `criarRespostasChecklist(respostas: { id; resposta; observacao? }[])` → POST `servico/osd0005`.
- `atualizarRespostaChecklist(codOs, codAtendimento, codChecklistResposta, body)` → PUT `servico/osw0001/{codOs}/{codAtendimento}/checklist/{codChecklistResposta}`.

### `src/routes/os.$codOs.tsx`

- Adicionar queries paralelas (TanStack Query, todas com `ensureQueryData`):
  - `["uno","os","detalhe", codOs, atend]` (já existe)
  - `["uno","os","situacoes"]`
  - `["uno","checklist","modelos"]`
- Render: card principal da OS + lista de 4 cards (1 por situação). Cada card mostra status e, quando expandido, lista os itens do modelo de checklist correspondente (lazy: query `["uno","checklist","itens", idModeloChecklist]` carregada ao abrir).
- Botão "Salvar" do checklist chama `criarRespostasChecklist` (mutation) e invalida o detalhe da OS.

### `.lovable/plan.md`

Atualizar com o mapeamento acima para servir de documentação dos endpoints.

## Arquivos

- novo: `src/lib/uno/os-situacoes.ts`
- novo: `src/lib/uno/checklist-modelos.ts`
- novo: `src/lib/uno/checklist-respostas.ts`
- editado: `src/routes/os.$codOs.tsx`
- editado: `.lovable/plan.md`

## Pendências a confirmar na primeira execução

- Nome exato dos campos retornados por `osq0001/inicializar` (situações) — ajustar tipos depois do primeiro response real. Seguem abaixo  
{
      "programaInfo": {
          "codigo": "OSQ0001",
          "titulo": "",
          "descricao": "",
          "comando": "[osq0001.do](http://osq0001.do)?method=listar",
          "nome": "Busca de Ordem de Serviço",
          "nomeProgramaEn": "Service Order Search",
          "rota": "/servico/osq0001",
          "corpo": "0001",
          "tpFuncao": "TELA",
          "indStruts": true,
          "indVue": true,
          "indAppIonic": false,
          "indAppFlutter": false
      },
      "situacoes": [
          {
              "codigo": 5,
              "codStatus": 5,
              "descricaoAbreviada": "Liberação do veículo",
              "descAbrev": "Liberação do veículo",
              "descricao": "Liberação do veículo",
              "indKanban": true
          },
          {
              "codigo": 10,
              "codStatus": 10,
              "descricaoAbreviada": "Em  Analise",
              "descAbrev": "Em  Analise",
              "descricao": "teste",
              "indKanban": true
          },
          {
              "codigo": 15,
              "codStatus": 15,
              "descricaoAbreviada": "Orçamento Enviado",
              "descAbrev": "Orçamento Enviado",
              "descricao": "teste",
              "indKanban": true
          },
          {
              "codigo": 20,
              "codStatus": 20,
              "descricaoAbreviada": "Aguardando Aceite",
              "descAbrev": "Aguardando Aceite",
              "descricao": "",
              "indKanban": true
          },
          {
              "codigo": 25,
              "codStatus": 25,
              "descricaoAbreviada": "Aguardando Peça",
              "descAbrev": "Aguardando Peça",
              "descricao": "",
              "indKanban": true
          },
          {
              "codigo": 30,
              "codStatus": 30,
              "descricaoAbreviada": "Em Andamento",
              "descAbrev": "Em Andamento",
              "descricao": "Em Andamento",
              "indKanban": true
          },
          {
              "codigo": 35,
              "codStatus": 35,
              "descricaoAbreviada": "Em Teste",
              "descAbrev": "Em Teste",
              "descricao": "",
              "indKanban": true
          },
          {
              "codigo": 50,
              "codStatus": 50,
              "descricaoAbreviada": "Finalizada",
              "descAbrev": "Finalizada",
              "descricao": "",
              "indKanban": false
          },
          {
              "codigo": 70,
              "codStatus": 70,
              "descricaoAbreviada": "Suspensa",
              "descAbrev": "Suspensa",
              "descricao": "",
              "indKanban": false
          },
          {
              "codigo": 90,
              "codStatus": 90,
              "descricaoAbreviada": "Cancelada",
              "descAbrev": "Cancelada",
              "descricao": "Cancelada",
              "indKanban": false
          },
          {
              "codigo": 1,
              "codStatus": 1,
              "descricaoAbreviada": "Recepção",
              "descAbrev": "Recepção",
              "descricao": "Veiculo na recepção",
              "indKanban": true
          },
          {
              "codigo": 2,
              "codStatus": 2,
              "descricaoAbreviada": "Veículo na fila",
              "descAbrev": "Veículo na fila",
              "descricao": "Veículo na fila",
              "indKanban": true
          },
          {
              "codigo": 3,
              "codStatus": 3,
              "descricaoAbreviada": "Higienização",
              "descAbrev": "Higienização",
              "descricao": "Veiculo na higienização",
              "indKanban": true
          },
          {
              "codigo": 4,
              "codStatus": 4,
              "descricaoAbreviada": "Secagem",
              "descAbrev": "Secagem",
              "descricao": "Veículo na secagem"
          },
          {
              "codigo": 6,
              "codStatus": 6,
              "descricaoAbreviada": "Finalizado",
              "descAbrev": "Finalizado",
              "descricao": "Finalizado",
              "indKanban": true
          }
      ]
  }
- Como vincular **situação da OS ↔ modelo de checklist** (campo `idModeloChecklist` na situação? ou via outro relacionamento?). Assumo no plano que vem na situação; se não vier, adiciono uma chamada extra ou mapeamento manual.
- Se `osd0005` precisa receber `codOs`/`codAtendimento` em algum campo do body (o swagger mostra só `id/resposta/observacao` — pode ser que `id` seja o `idItemChecklist` da OS já instanciado).