import { unoGet } from "./client";
import { isMockOn } from "./mock-mode";
import { mockBuscarOSPorCodigo } from "./os-detalhe.mock";

/**
 * Busca detalhes de uma OS específica no UNO ERP.
 * Endpoint canônico: GET servico/osw0001/{codOs}/null
 * O segundo segmento (`null`) é mantido literalmente como aparece no
 * CURL fornecido pelo cliente — TODO documentar o significado real
 * (filial? variante?) quando for definido.
 */

export type OSDetalhe = {
  codOs: number | string;
  numero?: string | number;
  status?: string;
  codStatus?: number;
  cliente?: string | { nome?: string; razaoSocial?: string };
  codCliente?: number;
  placa?: string;
  dtAbertura?: string;
  dtPrevisaoConclusao?: string;
  dtComprometida?: string;
  nomeContato?: string;
  ddd?: string;
  telefone?: string;
  categoria?: string;
  descricaoCategoria?: string;
} & Record<string, unknown>;

export async function buscarOSPorCodigo(
  codOs: string | number,
  codAtendimento: string | number,
): Promise<OSDetalhe> {
  if (isMockOn()) return mockBuscarOSPorCodigo(codOs, codAtendimento);

  return unoGet<OSDetalhe>(
    `servico/osw0001/${encodeURIComponent(String(codOs))}/${encodeURIComponent(String(codAtendimento))}`,
  );
}