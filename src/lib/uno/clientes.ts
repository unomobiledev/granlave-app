import { unoGet, unoPost } from "./client";
import {
  mockBuscarUltimoClientePorPlaca,
  mockCadastrarCliente,
  mockListarClientesPaginado,
} from "./clientes.mock";
import { isMockOn } from "./mock-mode";

export type Cliente = {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
};

/** Shape bruto retornado pelo endpoint cdw0101 do UNO. */
export type ClienteUno = {
  codCliente: number;
  nomeCliente?: string;
  razaoSocial?: string;
  cnpj?: string;
  tipo?: string;
  cidade?: string;
  siglaUf?: string;
  situacao?: number;
  descricaoSituacao?: string;
  [key: string]: unknown;
};

type PageResponse<T> = {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

export type ClientesPage = {
  items: Cliente[];
  raw: ClienteUno[];
  page: number;
  totalPages: number;
  totalElements: number;
};

function mapClienteUno(c: ClienteUno): Cliente {
  return {
    id: String(c.codCliente),
    razaoSocial: c.razaoSocial ?? c.nomeCliente ?? "—",
    nomeFantasia: c.nomeCliente ?? c.razaoSocial ?? "—",
    cnpj: c.cnpj ?? "",
  };
}

/**
 * Lista clientes ativos paginados.
 * Endpoint UNO: GET cadastro/cdw0101?page={n}&situacao=1&requiresCounts=true&size={size}
 */
export async function listarClientesPaginado(
  opts: { page?: number; size?: number } = {},
): Promise<ClientesPage> {
  if (isMockOn()) return mockListarClientesPaginado(opts);
  const page = opts.page ?? 0;
  const size = opts.size ?? 20;
  const resp = await unoGet<PageResponse<ClienteUno>>(
    `cadastro/cdw0101?page=${page}&situacao=1&requiresCounts=true&size=${size}`,
  );
  const raw = resp.content ?? [];
  return {
    items: raw.map(mapClienteUno),
    raw,
    page: resp.number ?? page,
    totalPages: resp.totalPages ?? 1,
    totalElements: resp.totalElements ?? raw.length,
  };
}

/**
 * Busca o último cliente atendido para uma placa específica.
 * TODO(UNO): substituir mock pela chamada real.
 * Endpoint sugerido: GET /cliente/by-placa/{placa}
 */
export async function buscarUltimoClientePorPlaca(placa: string): Promise<Cliente | null> {
  if (isMockOn()) return mockBuscarUltimoClientePorPlaca(placa);
  return unoGet<Cliente | null>(`cliente/by-placa/${encodeURIComponent(placa)}`);
}

/**
 * Resolve uma placa para o `codItem` correspondente no UNO.
 * TODO(UNO): substituir mock pela chamada real quando o endpoint estiver disponível.
 * Por ora, devolve sempre `1` para qualquer placa não vazia.
 */
export async function buscarCodItemPorPlaca(placa: string): Promise<number | null> {
  if (!placa.trim()) return null;
  return 1;
}

/**
 * Cadastra um novo cliente.
 * TODO(UNO): substituir mock pela chamada real.
 * Endpoint sugerido: POST /cliente { nomeFantasia, razaoSocial, cnpj }
 */
export async function cadastrarCliente(input: {
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
}): Promise<Cliente> {
  if (isMockOn()) return mockCadastrarCliente(input);
  return unoPost<Cliente>("cliente", input);
}