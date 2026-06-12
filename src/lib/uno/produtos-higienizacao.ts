import { unoGet, unoPost } from "./client";
import { isMockOn } from "./mock-mode";
import {
  mockListarProdutosHigienizacao,
  mockCadastrarProdutoHigienizacao,
  mockListarProdutosReposicao,
} from "./produtos-higienizacao.mock";

/** Shape bruto retornado pelo endpoint osw0008 / cdf0201 do UNO. */
export type ProdutoHigienizacaoUno = {
  codProduto?: string | number;
  descComercial?: string;
  descTecnica?: string;
  un?: string;
  situacao?: number;
  [key: string]: unknown;
};

export type ProdutoHigienizacao = {
  id: string;
  codProduto: string;
  descComercial: string;
  descTecnica: string;
  un: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

export type ProdutosPage = {
  items: ProdutoHigienizacao[];
  raw: ProdutoHigienizacaoUno[];
  page: number;
  totalPages: number;
  totalElements: number;
};

function mapProduto(p: ProdutoHigienizacaoUno): ProdutoHigienizacao {
  const cod = p.codProduto != null ? String(p.codProduto) : "";
  return {
    id: cod,
    codProduto: cod,
    descComercial: p.descComercial ?? p.descTecnica ?? "—",
    descTecnica: p.descTecnica ?? p.descComercial ?? "—",
    un: p.un ?? "",
  };
}

/**
 * Lista produtos de higienização paginados.
 * Endpoint UNO: GET servico/osw0008?requiresCounts=true&page={n}&size={size}
 */
export async function listarProdutosHigienizacao(
  opts: { page?: number; size?: number } = {},
): Promise<ProdutosPage> {
  if (isMockOn()) return mockListarProdutosHigienizacao(opts);
  const page = opts.page ?? 0;
  const size = opts.size ?? 20;
  const resp = await unoGet<PageResponse<ProdutoHigienizacaoUno>>(
    `servico/osw0008?requiresCounts=true&page=${page}&size=${size}`,
  );
  const raw = resp.content ?? [];
  return {
    items: raw.map(mapProduto),
    raw,
    page: resp.number ?? page,
    totalPages: resp.totalPages ?? 1,
    totalElements: resp.totalElements ?? raw.length,
  };
}

/** Shape bruto retornado pelo endpoint de reposição da OS. */
export type ReposicaoItemUno = {
  produto?: {
    codigo?: string | number;
    descricaoComercial?: string;
    indServico?: boolean;
  };
  [key: string]: unknown;
};

/**
 * Lista produtos disponíveis para reposição em uma OS de serviço.
 * Endpoint UNO: GET servico/osw0001/{codOs}/{codAtendimento}/reposicao
 */
export async function listarProdutosReposicao(
  codOs: number,
  codAtendimento: number,
): Promise<ProdutoHigienizacao[]> {
  if (isMockOn()) return mockListarProdutosReposicao();
  const resp = await unoGet<ReposicaoItemUno[]>(
    `servico/osw0001/${codOs}/${codAtendimento}/reposicao`,
  );
  return (resp ?? []).map((item) => {
    const cod = item.produto?.codigo != null ? String(item.produto.codigo) : "";
    const desc = item.produto?.descricaoComercial ?? "—";
    return {
      id: cod,
      codProduto: cod,
      descComercial: desc,
      descTecnica: desc,
      un: "",
    };
  });
}

export type NovoProdutoInput = {
  codProduto: string;
  descComercial: string;
  descTecnica: string;
  un: string;
  classFiscalCodigo: string;
};

/**
 * Cadastra novo produto de higienização.
 * Endpoint UNO: POST cadastro/cdf0201
 */
export async function cadastrarProdutoHigienizacao(
  input: NovoProdutoInput,
): Promise<ProdutoHigienizacao> {
  if (isMockOn()) {
    return mockCadastrarProdutoHigienizacao({
      codProduto: input.codProduto,
      descComercial: input.descComercial,
      descTecnica: input.descTecnica,
      un: input.un,
    });
  }
  const payload = {
    tpAquisicao: 1,
    situacao: 1,
    codProduto: input.codProduto,
    descComercial: input.descComercial,
    descTecnica: input.descTecnica,
    un: input.un,
    indMateriaPrima: true,
    classFiscal: { codigo: input.classFiscalCodigo },
    moeda: "R$",
    localizacao: null,
    codBeneficioFiscal: null,
    codMensagem: null,
    ccusto: null,
    fornecedor: {},
    percMargemLucro: 0,
    aliquotaIcmsSt: 0,
    aliquotaIpi: 0,
    aliquotaIss: 0,
    qtdMinEtq: null,
    qtdMultipla: null,
    qtdPorEmbalagem: null,
    percCustoFinanceiro: null,
  };
  const resp = await unoPost<ProdutoHigienizacaoUno>("cadastro/cdf0201", payload);
  return mapProduto(resp ?? (payload as ProdutoHigienizacaoUno));
}