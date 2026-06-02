import { unoGet, unoPost } from "./client";
import {
  mockBuscarUltimoClientePorPlaca,
  mockBuscarClientes,
  mockCadastrarCliente,
} from "./clientes.mock";

export type Cliente = {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
};

// Quando as APIs reais da UNO estiverem definidas, basta trocar USE_MOCK = false
// e ajustar os endpoints abaixo.
const USE_MOCK = false;

/**
 * Busca o último cliente atendido para uma placa específica.
 * TODO(UNO): substituir mock pela chamada real.
 * Endpoint sugerido: GET /cliente/by-placa/{placa}
 */
export async function buscarUltimoClientePorPlaca(placa: string): Promise<Cliente | null> {
  if (USE_MOCK) return mockBuscarUltimoClientePorPlaca(placa);
  return unoGet<Cliente | null>(`cliente/by-placa/${encodeURIComponent(placa)}`);
}

/**
 * Busca clientes por nome/razão social/CNPJ.
 * TODO(UNO): substituir mock pela chamada real.
 * Endpoint sugerido: GET /cliente?q={query}&size={limit}
 */
export async function buscarClientes(query: string, limit = 10): Promise<Cliente[]> {
  if (USE_MOCK) return mockBuscarClientes(query, limit);
  return unoGet<Cliente[]>(
    `cliente?q=${encodeURIComponent(query)}&size=${limit}`,
  );
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
  if (USE_MOCK) return mockCadastrarCliente(input);
  return unoPost<Cliente>("cliente", input);
}