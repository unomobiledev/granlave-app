Vou ajustar a tela de detalhe da OS para que as informações principais da OS apareçam no header superior, como você pediu.

Plano:
1. Atualizar `AppHeader` para aceitar um bloco opcional de conteúdo abaixo do título/contadores.
2. Na rota `/os/$codOs`, renderizar os dados da OS dentro desse header, em vez de apenas no card central do conteúdo.
3. Manter o layout das etapas 3x2 abaixo do header, sem duplicar o card antigo no corpo da página.
4. Preservar o mesmo comportamento na tela de checklist, para os dados continuarem fixos no topo em todas as etapas.

Detalhe técnico:
- A tela atual já carrega os dados da OS no layout pai, mas eles estão dentro do `<main>`, abaixo do botão “Voltar”. Vou mover esse bloco para ser passado ao `AppHeader`, garantindo que ele apareça no topo junto do cabeçalho global.