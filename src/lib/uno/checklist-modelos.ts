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

/**
 * Item (pergunta) de um modelo de checklist conforme `cadastro/cdd0372`.
 *
 * `tipoResposta`:
 *  - 1 → Resposta booleana (OK/NOK)
 *  - 2 → Resposta livre (texto ou número, conforme heurística do enunciado)
 *  - 3 → Resposta combo (opções vindas em `comboFixo`, ex.: "Sim|Não|N/A")
 */
export type TipoResposta = 1 | 2 | 3;

export type ChecklistItemModelo = {
  idModeloChecklistPergunta: number;
  idModeloChecklist?: number;
  grupoPergunta?: string;
  pergunta: string;
  ordem?: number;
  tipoResposta: TipoResposta;
  tipoRespostaDescricao?: string;
  descricao?: string;
  comboFixo?: string;
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