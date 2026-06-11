import { unoGet } from "./client";
import type { PageResponse } from "./os";
import { isMockOn } from "./mock-mode";
import {
  mockListarModelosChecklist,
  mockListarItensModeloChecklist,
} from "./checklist-modelos.mock";

/**
 * Modelos de checklist e seus itens.
 * - GET cadastro/cdw0372         → lista de modelos
 * - GET cadastro/cdd0372         → itens (perguntas) de um modelo
 */

export type ChecklistModelo = {
  id?: number;
  codigo?: number;
  descricao?: string;
  nome?: string;
  codSituacao?: number;
  codStatus?: number;
} & Record<string, unknown>;

export type ChecklistItemModelo = {
  id: number;
  idModeloChecklist?: number;
  pergunta?: string;
  descricao?: string;
  tipoResposta?: string;
  obrigatorio?: boolean;
  ordem?: number;
} & Record<string, unknown>;

export async function listarModelosChecklist(
  opts: { size?: number } = {},
): Promise<ChecklistModelo[]> {
  if (isMockOn()) return mockListarModelosChecklist();
  const size = opts.size ?? 50;
  const data = await unoGet<PageResponse<ChecklistModelo>>(
    `cadastro/cdw0372?page=0&requiresCounts=true&size=${size}`,
  );
  return data.content ?? [];
}

export async function listarItensModeloChecklist(
  idModeloChecklist: number,
): Promise<ChecklistItemModelo[]> {
  if (isMockOn()) return mockListarItensModeloChecklist(idModeloChecklist);
  const data = await unoGet<ChecklistItemModelo[] | PageResponse<ChecklistItemModelo>>(
    `cadastro/cdd0372?idModeloChecklist=${idModeloChecklist}`,
  );
  if (Array.isArray(data)) return data;
  return data.content ?? [];
}

/**
 * Resolve o modelo de checklist vinculado a uma situação da OS.
 * Tenta `codSituacao` (1:1 com `codigo`) e cai para `codStatus`.
 */
export function findModeloForSituacao(
  modelos: ChecklistModelo[],
  situacao: { codigo: number; codStatus: number },
): ChecklistModelo | undefined {
  return modelos.find(
    (m) =>
      m.codSituacao === situacao.codigo ||
      m.codStatus === situacao.codStatus,
  );
}