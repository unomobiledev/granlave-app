import { unoGet } from "./client";
import {
  mockListarOSsPorStatus,
  type MockOS,
} from "./os.mock";

/**
 * Status das OSs no UNO ERP.
 * Cada status corresponde a um bloco da tela inicial e a uma etapa do sistema:
 *  - AGUARDANDO_FILA → bloco "Veículos na fila"          (pré-Etapa 1)
 *  - EM_ATENDIMENTO  → bloco "Veículos em atendimento"   (Etapas 1 → 4)
 *  - CONCLUIDO       → bloco "Veículos concluídos"       (pós-Etapa 4 ou finalizado antecipado)
 *
 * TODO(UNO): confirmar os valores reais (strings) usados pelo UNO e ajustar abaixo.
 */
export const OS_STATUS = {
  AGUARDANDO_FILA: "AGUARDANDO_FILA",
  EM_ATENDIMENTO: "EM_ATENDIMENTO",
  CONCLUIDO: "CONCLUIDO",
} as const;
export type OSStatus = (typeof OS_STATUS)[keyof typeof OS_STATUS];

export type OS = {
  id?: string | number;
  numero?: string | number;
  numeroOs?: string | number;
  dataEmissao?: string;
  data?: string;
  cliente?: string | { nome?: string; razaoSocial?: string };
  clienteNome?: string;
  situacao?: string;
  status?: string;
  placa?: string;
  [key: string]: unknown;
};

export type PageResponse<T> = {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

export function listarUltimasOS(limit = 10) {
  return unoGet<PageResponse<OS>>(
    `servico/osq0001?page=0&requiresCounts=true&size=${limit}`,
  );
}

// Flag única para alternar entre mock e API real.
// Quando o contrato UNO estiver definido, trocar para `false` e ajustar
// os endpoints abaixo. A UI não muda.
const USE_MOCK = true;

/**
 * Lista OSs filtradas por status.
 * TODO(UNO): substituir mock pela chamada real.
 * Endpoint sugerido: GET servico/osq0001?situacao={status}&page=0&size={limit}
 */
export async function listarOSsPorStatus(
  status: OSStatus,
  opts: { limit?: number } = {},
): Promise<OS[]> {
  const limit = opts.limit ?? 50;
  if (USE_MOCK) {
    const rows = await mockListarOSsPorStatus(status, { limit });
    return rows.map(mockToOS);
  }
  const page = await unoGet<PageResponse<OS>>(
    `servico/osq0001?situacao=${encodeURIComponent(status)}&page=0&size=${limit}`,
  );
  return page.content ?? [];
}

export function listarOSsNaFila(limit = 50) {
  return listarOSsPorStatus(OS_STATUS.AGUARDANDO_FILA, { limit });
}

export function listarOSsEmAtendimento(limit = 50) {
  return listarOSsPorStatus(OS_STATUS.EM_ATENDIMENTO, { limit });
}

export function listarOSsConcluidas(limit = 8) {
  return listarOSsPorStatus(OS_STATUS.CONCLUIDO, { limit });
}

/** Shape normalizado consumido pelos cards da home. */
export type OSCardData = {
  id: string;
  os: string;
  placa: string;
  cliente: string;
  dataEmissao?: string;
  situacao: OSStatus | string;
  etapaAtual?: number;
  finalizadoAntecipado?: { etapa: number; motivo: string };
};

export function mapOSToCardData(os: OS): OSCardData {
  const cliente =
    typeof os.cliente === "string"
      ? os.cliente
      : os.cliente?.nome ?? os.cliente?.razaoSocial ?? os.clienteNome ?? "—";
  const numero = String(os.numero ?? os.numeroOs ?? os.id ?? "—");
  const etapaRaw = (os as Record<string, unknown>).etapaAtual;
  const etapaAtual = typeof etapaRaw === "number" ? etapaRaw : undefined;
  const fa = (os as Record<string, unknown>).finalizadoAntecipado as
    | { etapa: number; motivo: string }
    | undefined;
  return {
    id: String(os.id ?? numero),
    os: numero,
    placa: String(os.placa ?? "—"),
    cliente,
    dataEmissao: os.dataEmissao ?? os.data,
    situacao: (os.situacao ?? os.status ?? "—") as string,
    etapaAtual,
    finalizadoAntecipado: fa,
  };
}

function mockToOS(m: MockOS): OS {
  return {
    id: m.id,
    numero: m.numero,
    placa: m.placa,
    cliente: m.cliente,
    dataEmissao: m.dataEmissao,
    situacao: m.situacao,
    etapaAtual: m.etapaAtual,
    finalizadoAntecipado: m.finalizadoAntecipado,
  } as OS;
}