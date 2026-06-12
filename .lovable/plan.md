## Objetivo

1. Criar a OS no ERP **somente** quando o usuário clicar em **"Abrir Ordem de Serviço"** (botão final da Etapa 1) — nunca antes.
2. Permitir trocar o cliente livremente enquanto a OS ainda não foi aberta; bloquear a troca depois que `truck.codOsErp` existir.

## Mudanças

**`src/components/stage1/Stage1Wizard.tsx`**

1. **Remover a criação automática da OS em `selecionarCliente`**:
   - Tirar a chamada `void ensureOsCriada(c)` ao confirmar o cliente.
   - `selecionarCliente` apenas grava o cliente no checklist e fecha o picker.

2. **Centralizar a criação no `handleAdvance`**:
   - `handleAdvance` continua chamando `ensureOsCriada(cliente)` antes de avançar, usando os dados atuais do checklist (cliente, motorista, celular).
   - É o único ponto que dispara `criarOS`.

3. **Combo "Produto de higienização"**:
   - Como a OS só existe após "Abrir OS", o combo fica desabilitado durante o preenchimento, com placeholder "Disponível após abrir a OS".
   - Removido o `useEffect` de mount que carregava produtos (não há `codOsErp` ainda na Etapa 1 antes do clique).
   - **Consequência:** o campo `produto_higienizacao` deixa de ser obrigatório para habilitar o botão "Abrir Ordem de Serviço". Será preenchido na Etapa 2 (ou em um passo D pós-criação, se preferir — ver pergunta abaixo).
   - Remover `produto_higienizacao` de `requiredFinal`.

4. **Passo B (Cliente) — bloquear troca após OS criada**:
   - Esconder o botão **"Trocar"** quando `truck.codOsErp` existir.
   - Exibir texto discreto: *"OS já aberta no ERP — cliente não pode mais ser alterado."*
   - Bloquear também a abertura do `pickerOpen` nesse estado.

## Ponto a confirmar

O combo "Produto de higienização" só funciona depois da OS aberta. Hoje ele está no mesmo Passo C dos demais dados. Posso:
- **(a)** Deixá-lo desabilitado no Passo C com aviso, e o usuário preenche na Etapa 2 (mais simples — recomendado).
- **(b)** Criar um Passo D que só aparece após a OS ser aberta, ainda dentro da Etapa 1, para selecionar o produto.

Assumindo **(a)** por padrão.

## Fora do escopo

- Endpoint de atualização de cliente em OS existente.
- Cancelamento/reabertura de OS.
- Etapas 2+.
