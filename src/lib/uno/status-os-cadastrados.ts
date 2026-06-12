import { unoGet } from "./client";
import { isMockOn } from "./mock-mode";
import { mockListarSituacoesOS } from "./os-situacoes.mock";
import type { OSSituacao } from "./os-situacoes";

/**
 * Lista global de status (situações) de OS cadastrados no UNO ERP.
 * Endpoint: GET cadastro/cdw0050?page=0&requiresCounts=true&size=60&sort=codigo,asc
 *
 * Independente de OS. O conteúdo de cada card (progresso) depende do
 * `codStatus` da OS específica.
 */

export type StatusOSCadastrado = OSSituacao;

type CdwPage<T> = {
  content?: T[];
  totalElements?: number;
} & Record<string, unknown>;

export async function listarStatusOSCadastrados(): Promise<StatusOSCadastrado[]> {
  if (isMockOn()) return mockListarSituacoesOS();
  const data = await unoGet<CdwPage<StatusOSCadastrado> | StatusOSCadastrado[]>(
    "cadastro/cdw0050?page=0&requiresCounts=true&size=60&sort=codigo,asc",
  );
  if (Array.isArray(data)) return data;
  return data.content ?? [];
}