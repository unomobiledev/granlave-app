import type { ProdutoHigienizacao, ProdutoHigienizacaoUno, ProdutosPage } from "./produtos-higienizacao";

const PRODUTOS: ProdutoHigienizacao[] = [
  { id: "1001", codProduto: "1001", descComercial: "Detergente Alcalino Concentrado", descTecnica: "DET-ALC-25L",   un: "LT" },
  { id: "1002", codProduto: "1002", descComercial: "Desinfetante Quaternário",        descTecnica: "DES-QUAT-20L",  un: "LT" },
  { id: "1003", codProduto: "1003", descComercial: "Sanitizante Peracético",          descTecnica: "SAN-PER-10L",   un: "LT" },
  { id: "1004", codProduto: "1004", descComercial: "Ácido Nítrico 30%",               descTecnica: "ACD-NIT-30",    un: "LT" },
  { id: "1005", codProduto: "1005", descComercial: "Soda Cáustica em Escamas",        descTecnica: "SODA-ESC-25KG", un: "KG" },
];

export function mockListarProdutosHigienizacao(opts: { page?: number; size?: number } = {}): ProdutosPage {
  const page = opts.page ?? 0;
  const size = opts.size ?? 20;
  const start = page * size;
  const items = PRODUTOS.slice(start, start + size);
  const raw: ProdutoHigienizacaoUno[] = items.map((p) => ({
    codProduto: p.codProduto,
    descComercial: p.descComercial,
    descTecnica: p.descTecnica,
    un: p.un,
    situacao: 1,
  }));
  return {
    items,
    raw,
    page,
    totalPages: Math.max(1, Math.ceil(PRODUTOS.length / size)),
    totalElements: PRODUTOS.length,
  };
}

export function mockCadastrarProdutoHigienizacao(input: {
  codProduto: string;
  descComercial: string;
  descTecnica: string;
  un: string;
}): ProdutoHigienizacao {
  const novo: ProdutoHigienizacao = { id: input.codProduto, ...input };
  PRODUTOS.unshift(novo);
  return novo;
}