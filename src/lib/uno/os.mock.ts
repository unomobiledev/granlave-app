import { OS_STATUS, type OSStatus } from "./os.types";

export type MockOS = {
  id: string;
  numero: string;
  placa: string;
  cliente: string;
  dataEmissao: string;
  situacao: OSStatus;
  codStatus?: number;
  etapaAtual?: number;
  finalizadoAntecipado?: { etapa: number; motivo: string };
};

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

const FILA: MockOS[] = [
  {
    id: "fila-1",
    numero: "OS-2401",
    placa: "ABC-1A23",
    cliente: "JBS Foods",
    dataEmissao: minutesAgo(12),
    situacao: OS_STATUS.AGUARDANDO_FILA,
  },
  {
    id: "fila-2",
    numero: "OS-2402",
    placa: "DEF-4B56",
    cliente: "Marfrig",
    dataEmissao: minutesAgo(7),
    situacao: OS_STATUS.AGUARDANDO_FILA,
  },
  {
    id: "fila-3",
    numero: "OS-2403",
    placa: "GHI-7C89",
    cliente: "Minerva Foods",
    dataEmissao: minutesAgo(3),
    situacao: OS_STATUS.AGUARDANDO_FILA,
  },
];

const ATENDIMENTO: MockOS[] = [
  {
    id: "at-1",
    numero: "OS-2346",
    placa: "SEW-5H07",
    cliente: "Via Group Participações",
    dataEmissao: minutesAgo(50),
    situacao: OS_STATUS.EM_ATENDIMENTO,
    etapaAtual: 1,
  },
  {
    id: "at-2",
    numero: "OS-2347",
    placa: "RKL-2D89",
    cliente: "Cargill Agrícola",
    dataEmissao: minutesAgo(75),
    situacao: OS_STATUS.EM_ATENDIMENTO,
    etapaAtual: 2,
  },
  {
    id: "at-3",
    numero: "OS-2348",
    placa: "QPM-7B34",
    cliente: "BRF S.A.",
    dataEmissao: minutesAgo(110),
    situacao: OS_STATUS.EM_ATENDIMENTO,
    etapaAtual: 3,
  },
  {
    id: "at-4",
    numero: "OS-2349",
    placa: "TGH-9E12",
    cliente: "Bunge Alimentos",
    dataEmissao: minutesAgo(165),
    situacao: OS_STATUS.EM_ATENDIMENTO,
    etapaAtual: 4,
  },
];

const CONCLUIDAS: MockOS[] = [
  {
    id: "c-1",
    numero: "OS-2340",
    placa: "XYZ-1B45",
    cliente: "Cargill Agrícola",
    dataEmissao: minutesAgo(220),
    situacao: OS_STATUS.CONCLUIDO,
  },
  {
    id: "c-2",
    numero: "OS-2341",
    placa: "JKL-9F22",
    cliente: "BRF S.A.",
    dataEmissao: minutesAgo(310),
    situacao: OS_STATUS.CONCLUIDO,
  },
  {
    id: "c-3",
    numero: "OS-2342",
    placa: "MNO-3K78",
    cliente: "JBS Foods",
    dataEmissao: minutesAgo(420),
    situacao: OS_STATUS.CONCLUIDO,
    finalizadoAntecipado: { etapa: 2, motivo: "Não requer secagem" },
  },
  {
    id: "c-4",
    numero: "OS-2343",
    placa: "PQR-6L11",
    cliente: "Bunge Alimentos",
    dataEmissao: minutesAgo(540),
    situacao: OS_STATUS.CONCLUIDO,
  },
];

const BY_STATUS: Record<OSStatus, MockOS[]> = {
  [OS_STATUS.AGUARDANDO_FILA]: FILA,
  [OS_STATUS.EM_ATENDIMENTO]: ATENDIMENTO,
  [OS_STATUS.CONCLUIDO]: CONCLUIDAS,
};

export function mockListarOSsPorStatus(
  status: OSStatus,
  opts: { limit?: number } = {},
): Promise<MockOS[]> {
  const list = BY_STATUS[status] ?? [];
  const limited = opts.limit ? list.slice(0, opts.limit) : list;
  return new Promise((resolve) => setTimeout(() => resolve(limited), 300));
}