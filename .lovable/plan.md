# Cards "Veículos em atendimento" — 2 por linha + layout horizontal

## Mudanças em `src/routes/index.tsx`

### Grid (linha 101)
- `sm:grid-cols-2 xl:grid-cols-4` → `sm:grid-cols-2` (fica em 2 colunas em todos os breakpoints).

### `AtendimentoCard` (linhas 255–308)
Reorganizar para layout horizontal mais compacto e largo, aproveitando o espaço extra para mostrar `placa` (campo já disponível em `OSCardData` mas não exibido hoje).

Layout proposto (uma linha, três blocos):
```
[ícone 12x12]  [OS · Cliente · Responsável]   |   [Placa · Etapa · min]
```

Detalhes:
- Reduzir padding do card: `p-6` → `p-4`.
- Ícone do caminhão: `h-14 w-14` → `h-12 w-12`; ícone interno `h-7 w-7` → `h-6 w-6`.
- Remover o bloco inferior destacado (`mt-5 rounded-lg border bg-background/60 p-4`) — mover seu conteúdo (status + tempo + data) para a coluna direita, sem caixa interna, para deixar o card mais "fino" (menor altura).
- Coluna esquerda (flex-1):
  - `OS-xxxx` (mantém estilo atual)
  - Nome do cliente (`text-base font-semibold`, truncate)
  - Responsável com ícone `User` (se houver)
- Separador vertical sutil (`border-l border-primary/20`) entre as colunas em ≥ sm.
- Coluna direita (shrink-0, ~40% da largura ou min-w fixo):
  - **Placa** com ícone (novo — usar ícone `Hash` ou texto "Placa"): `font-mono text-sm font-semibold`.
  - Badge da etapa/status (`descStatus` ou `Etapa X de N`) — mesmo estilo atual.
  - Tempo (`Clock` + `Xmin`) e data comprometida (`Calendar` + data) em linha única `text-[11px] text-muted-foreground`.
- `ChevronRight` continua na ponta direita, alinhado verticalmente ao centro.

Resultado: card visivelmente mais largo, ~30% mais baixo, mostrando placa que antes não aparecia.

## Sem mudanças
- `OSCardData` e mapeamento (placa já existe).
- Demais cards (`QueueCard`, `ConcluidoCard`).
