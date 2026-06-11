import type { Cliente, ClienteUno, ClientesPage } from "./clientes";

const MOCK_CLIENTES: Cliente[] = [
  { id: "1", razaoSocial: "Via Group Participações Ltda", nomeFantasia: "Via Group", cnpj: "12.345.678/0001-90" },
  { id: "2", razaoSocial: "Cargill Agrícola S.A.", nomeFantasia: "Cargill", cnpj: "60.498.706/0001-57" },
  { id: "3", razaoSocial: "BRF S.A.", nomeFantasia: "BRF", cnpj: "01.838.723/0001-27" },
  { id: "4", razaoSocial: "Bunge Alimentos S.A.", nomeFantasia: "Bunge", cnpj: "84.046.101/0001-59" },
  { id: "5", razaoSocial: "JBS Foods S.A.", nomeFantasia: "JBS", cnpj: "02.916.265/0001-60" },
];

const PLACA_TO_CLIENTE: Record<string, string> = {
  "SEW5H07": "1",
  "RKL2D89": "2",
  "QPM7B34": "3",
  "TGH9E12": "4",
  "ABC1A23": "5",
};

const normalizePlaca = (p: string) => p.toUpperCase().replace(/[^A-Z0-9]/g, "");

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export async function mockBuscarUltimoClientePorPlaca(placa: string): Promise<Cliente | null> {
  await delay();
  const id = PLACA_TO_CLIENTE[normalizePlaca(placa)];
  return MOCK_CLIENTES.find((c) => c.id === id) ?? null;
}

export async function mockBuscarClientes(query: string, limit = 10): Promise<Cliente[]> {
  await delay();
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_CLIENTES.slice(0, limit);
  return MOCK_CLIENTES.filter(
    (c) =>
      c.razaoSocial.toLowerCase().includes(q) ||
      c.nomeFantasia.toLowerCase().includes(q) ||
      c.cnpj.replace(/\D/g, "").includes(q.replace(/\D/g, "")),
  ).slice(0, limit);
}

let nextId = MOCK_CLIENTES.length + 1;
export async function mockCadastrarCliente(input: {
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
}): Promise<Cliente> {
  await delay(450);
  const novo: Cliente = { id: String(nextId++), ...input };
  MOCK_CLIENTES.unshift(novo);
  return novo;
}

export function mockListarClientesPaginado(opts: { page?: number; size?: number } = {}): ClientesPage {
  const page = opts.page ?? 0;
  const size = opts.size ?? 20;
  const start = page * size;
  const items = MOCK_CLIENTES.slice(start, start + size);
  const raw: ClienteUno[] = items.map((c) => ({
    codCliente: Number(c.id) || 0,
    nomeCliente: c.nomeFantasia,
    razaoSocial: c.razaoSocial,
    cnpj: c.cnpj,
    cidade: "São Paulo",
    siglaUf: "SP",
    situacao: 1,
  }));
  return {
    items,
    raw,
    page,
    totalPages: Math.max(1, Math.ceil(MOCK_CLIENTES.length / size)),
    totalElements: MOCK_CLIENTES.length,
  };
}