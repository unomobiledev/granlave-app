import { unoGet } from "./client";
import {
  mockListarOSsPorStatus,
  type MockOS,
} from "./os.mock";
import { OS_STATUS, OS_COD_STATUS, type OSStatus } from "./os.types";

export { OS_STATUS, type OSStatus };

export type OS = {
  // Shape real retornado por /servico/osq0001
  codOs?: number | string;
  codAtendimento?: number;
  codEmpresa?: number;
  prioridade?: number;
  dtComprometida?: string;
  codCliente?: number;
  nomeCliente?: string;
  codResponsavel?: number;
  nomeResponsavel?: string;
  codStatus?: number;
  descAbrevStatus?: string;
  // Campos legados/mock — mantidos opcionais para retro-compat
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
const USE_MOCK = false;

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
  // O endpoint aceita `status` numérico; fazemos uma chamada por código
  // em paralelo (1 request por status).
  const codigos = OS_COD_STATUS[status];
  const pages = await Promise.all(
    codigos.map((cod) =>
      unoGet<PageResponse<OS>>(
        `servico/osq0001?page=0&requiresCounts=true&size=${limit}&status=${cod}`,
      ),
    ),
  );
  const all = pages.flatMap((p) => p.content ?? []);
  return all.slice(0, limit);
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
  codOs: string;
  os: string;
  placa?: string;
  cliente: string;
  dataEmissao?: string;
  situacao: OSStatus | string;
  descStatus?: string;
  responsavel?: string;
  prioridade?: number;
  etapaAtual?: number;
  finalizadoAntecipado?: { etapa: number; motivo: string };
};

export function mapOSToCardData(os: OS): OSCardData {
  const cliente =
    os.nomeCliente ??
    (typeof os.cliente === "string"
      ? os.cliente
      : os.cliente?.nome ?? os.cliente?.razaoSocial) ??
    os.clienteNome ??
    "—";
  const codOs = String(os.codOs ?? os.id ?? os.numero ?? os.numeroOs ?? "—");
  const label = `OS-${codOs}`;
  const etapaRaw = (os as Record<string, unknown>).etapaAtual;
  const etapaAtual = typeof etapaRaw === "number" ? etapaRaw : undefined;
  const fa = (os as Record<string, unknown>).finalizadoAntecipado as
    | { etapa: number; motivo: string }
    | undefined;
  const descStatus =
    os.descAbrevStatus ??
    os.situacao ??
    os.status ??
    situacaoFromCodStatus(os.codStatus) ??
    undefined;
  return {
    id: codOs,
    codOs,
    os: label,
    placa: os.placa ? String(os.placa) : undefined,
    cliente,
    dataEmissao: os.dtComprometida ?? os.dataEmissao ?? os.data,
    situacao: descStatus ?? "—",
    descStatus,
    responsavel: os.nomeResponsavel,
    prioridade: typeof os.prioridade === "number" ? os.prioridade : undefined,
    etapaAtual,
    finalizadoAntecipado: fa,
  };
}

function situacaoFromCodStatus(cod?: number): OSStatus | undefined {
  if (cod == null) return undefined;
  for (const [status, codes] of Object.entries(OS_COD_STATUS) as [
    OSStatus,
    readonly number[],
  ][]) {
    if (codes.includes(cod)) return status;
  }
  return undefined;
}

function mockToOS(m: MockOS): OS {
  return {
    id: m.id,
    numero: m.numero,
    placa: m.placa,
    cliente: m.cliente,
    dataEmissao: m.dataEmissao,
    situacao: m.situacao,
    codStatus: m.codStatus,
    etapaAtual: m.etapaAtual,
    finalizadoAntecipado: m.finalizadoAntecipado,
  } as OS;
}