import { unoGet } from "./client";

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