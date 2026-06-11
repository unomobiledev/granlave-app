import { unoPost } from "./client";
import { isMockOn } from "./mock-mode";

/**
 * Criação de OS no UNO ERP.
 * Endpoint: POST servico/osf0001
 *
 * O payload espelha o CURL fornecido pelo cliente. Campos administrativos
 * (categoria, modalidade, colaborador, etc.) ficam hardcoded até o UNO
 * definir como expor essas escolhas.
 */

export type CriarOSInput = {
  /** Código numérico do cliente no UNO. */
  codCliente: number;
  /** Nome do contato (usamos o motorista por enquanto). */
  nomeContato: string;
  ddd?: string;
  telefone?: string;
  /** Data base usada para abertura / previsão / comprometida. Default = hoje. */
  dataAbertura?: Date;
};

export type OSCriada = {
  codOs: number | string;
  numero?: string | number;
  [key: string]: unknown;
};

function isoZero(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T00:00:00`;
}

export async function criarOS(input: CriarOSInput): Promise<OSCriada> {
  const data = input.dataAbertura ?? new Date();
  const isoDate = isoZero(data);

  const payload = {
    qtd: 1,
    dtAbertura: isoDate,
    tpOs: 1,
    status: "5 - Não Iniciada",
    codStatus: 5,
    codColaboradorImplant: 1,
    codCliente: input.codCliente,
    codColaborador: 1,
    codModalidade: 1,
    codCategoria: 1,
    categoria: "1 - MANUTENÇÃO CORRETIVA",
    descricaoCategoria: "MANUTENÇÃO CORRETIVA",
    dtPrevisaoConclusao: isoDate,
    dtComprometida: isoDate,
    origem: 1,
    codContato: 1,
    codOs: "",
    codAtendimento: "",
    prioridade: 5,
    nomeContato: input.nomeContato,
    ddd: input.ddd ?? "",
    telefone: input.telefone ?? "",
    codStatusDefeito: 5,
  };

  if (isMockOn()) {
    const codOs = Math.floor(2400 + Math.random() * 600);
    return new Promise((resolve) =>
      setTimeout(
        () => resolve({ codOs, numero: `OS-${codOs}` }),
        400,
      ),
    );
  }

  return unoPost<OSCriada>("servico/osf0001", payload);
}