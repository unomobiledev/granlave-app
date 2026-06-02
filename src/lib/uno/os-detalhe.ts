import { unoGet } from "./client";

/**
 * Busca detalhes de uma OS específica no UNO ERP.
 * Endpoint canônico: GET servico/osw0001/{codOs}/null
 *
 * O segundo segmento (`null`) é mantido literalmente como aparece no
 * CURL fornecido pelo cliente — TODO documentar o significado real
 * (filial? variante?) quando for definido.
 */

const USE_MOCK = true;

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
): Promise<OSDetalhe> {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            codOs,
            numero: typeof codOs === "string" && codOs.startsWith("OS-") ? codOs : `OS-${codOs}`,
            status: "5 - Não Iniciada",
            codStatus: 5,
            cliente: "Cliente Mock",
            codCliente: 1,
            placa: "ABC-1D23",
            dtAbertura: new Date().toISOString(),
            nomeContato: "Motorista Mock",
            ddd: "15",
            telefone: "988358196",
            categoria: "1 - MANUTENÇÃO CORRETIVA",
            descricaoCategoria: "MANUTENÇÃO CORRETIVA",
          }),
        300,
      ),
    );
  }

  return unoGet<OSDetalhe>(
    `servico/osw0001/${encodeURIComponent(String(codOs))}/null`,
  );
}