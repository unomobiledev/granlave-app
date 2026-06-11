# Botão Home ao lado do toggle de Mock

No `src/components/AppHeader.tsx`, adicionar um botão ícone `Home` (lucide-react) imediatamente **à direita** do bloco do `Switch` "Modo mock", antes do botão Configurações.

- Ícone: `Home` do `lucide-react`.
- Estilo: `<Button variant="ghost" size="icon" asChild>` envolvendo um `<Link to="/">` com `aria-label="Ir para a home"`.
- Posição: dentro do mesmo `div.flex.items-center.gap-4`, entre o grupo do switch e o `<Button ... Configurações>`.

Nenhuma outra mudança.
