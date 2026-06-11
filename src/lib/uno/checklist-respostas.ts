import { unoGet, unoPost, unoPut } from "./client";
import { isMockOn } from "./mock-mode";

/**
 * Checklist da OS — leitura e gravação.
 *
 * - GET  servico/osw0001/{codOs}/{codAtendimento}/checklist
 *        Lista checklists já gravados para a OS/atendimento.
 * - POST cadastro/checklist
 *        Cria um checklist novo (cabeçalho + respostas[]).
 * - PUT  servico/osw0001/{codOs}/{codAtendimento}/checklist/{codChecklistResposta}
 *        Atualiza uma resposta individual já existente.
 */

export type RespostaItemPayload = {
  idChecklistResposta?: number;
  idChecklist?: number;
  idModeloChecklistPergunta: number;
  dtResposta: string;
  pergunta: string;
  resposta: string;
  observacao?: string;
  codColaborador?: number;
};

export type ChecklistCreatePayload = {
  idModeloChecklist: number;
  nomeChecklist: string;
  situacao: number;
  dtInicio: string;
  dtFim?: string | null;
  observacao?: string;
  origem: number;
  codOportunidade?: number;
  codOs: number;
  codAtendimento: number;
  codOcorrencia?: number;
  resultado?: number;
  respostas: RespostaItemPayload[];
};

export type RespostaGravada = {
  idChecklistResposta: number;
  idChecklist: number;
  idModeloChecklistPergunta: number;
  pergunta?: string;
  resposta?: string;
  observacao?: string;
  dtResposta?: string;
  codColaborador?: number;
} & Record<string, unknown>;

export type ChecklistGravado = {
  idChecklist: number;
  idModeloChecklist: number;
  nomeChecklist?: string;
  situacao?: number;
  codOs?: number;
  codAtendimento?: number;
  dtInicio?: string;
  dtFim?: string | null;
  respostas: RespostaGravada[];
} & Record<string, unknown>;

/* ---------------- Mock store ---------------- */

type MockKey = string;
const mockStore: Map<MockKey, ChecklistGravado[]> = new Map();
let mockChecklistSeq = 1000;
let mockRespostaSeq = 5000;
const keyOf = (codOs: number | string, codAtendimento: number | string): MockKey =>
  `${codOs}::${codAtendimento}`;

function mockListar(codOs: number | string, codAtendimento: number | string) {
  return mockStore.get(keyOf(codOs, codAtendimento)) ?? [];
}

function mockCriar(payload: ChecklistCreatePayload): ChecklistGravado {
  const idChecklist = ++mockChecklistSeq;
  const gravado: ChecklistGravado = {
    idChecklist,
    idModeloChecklist: payload.idModeloChecklist,
    nomeChecklist: payload.nomeChecklist,
    situacao: payload.situacao,
    codOs: payload.codOs,
    codAtendimento: payload.codAtendimento,
    dtInicio: payload.dtInicio,
    dtFim: payload.dtFim ?? null,
    respostas: payload.respostas.map((r) => ({
      idChecklistResposta: ++mockRespostaSeq,
      idChecklist,
      idModeloChecklistPergunta: r.idModeloChecklistPergunta,
      pergunta: r.pergunta,
      resposta: r.resposta,
      observacao: r.observacao,
      dtResposta: r.dtResposta,
      codColaborador: r.codColaborador,
    })),
  };
  const k = keyOf(payload.codOs, payload.codAtendimento);
  const list = mockStore.get(k) ?? [];
  list.push(gravado);
  mockStore.set(k, list);
  return gravado;
}

function mockAtualizarResposta(
  codOs: number | string,
  codAtendimento: number | string,
  codChecklistResposta: number | string,
  body: { resposta: string; observacao?: string },
) {
  const list = mockStore.get(keyOf(codOs, codAtendimento)) ?? [];
  for (const cl of list) {
    for (const r of cl.respostas) {
      if (r.idChecklistResposta === Number(codChecklistResposta)) {
        r.resposta = body.resposta;
        r.observacao = body.observacao;
        return r;
      }
    }
  }
  return null;
}

/* ---------------- API ---------------- */

export async function listarChecklistsDaOS(
  codOs: number | string,
  codAtendimento: number | string,
): Promise<ChecklistGravado[]> {
  if (isMockOn()) return mockListar(codOs, codAtendimento);
  const data = await unoGet<ChecklistGravado[] | { content?: ChecklistGravado[] }>(
    `servico/osw0001/${encodeURIComponent(String(codOs))}/${encodeURIComponent(
      String(codAtendimento),
    )}/checklist`,
  );
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

export async function criarChecklist(
  payload: ChecklistCreatePayload,
): Promise<ChecklistGravado> {
  if (isMockOn()) return mockCriar(payload);
  return unoPost<ChecklistGravado>("cadastro/checklist", payload);
}

export async function atualizarRespostaChecklist(
  codOs: number | string,
  codAtendimento: number | string,
  codChecklistResposta: number | string,
  body: { resposta: string; observacao?: string },
): Promise<unknown> {
  if (isMockOn()) {
    return mockAtualizarResposta(codOs, codAtendimento, codChecklistResposta, body);
  }
  return unoPut(
    `servico/osw0001/${encodeURIComponent(String(codOs))}/${encodeURIComponent(
      String(codAtendimento),
    )}/checklist/${encodeURIComponent(String(codChecklistResposta))}`,
    body,
  );
}

/** Lê `codigo` (colaborador) do payload do JWT em localStorage.token. */
export function getCodColaboradorFromToken(): number {
  if (typeof window === "undefined") return 0;
  try {
    const token = window.localStorage.getItem("token");
    if (!token) return 0;
    const parts = token.split(".");
    if (parts.length < 2) return 0;
    const payload = JSON.parse(
      decodeURIComponent(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      ),
    ) as { codigo?: number };
    return typeof payload.codigo === "number" ? payload.codigo : 0;
  } catch {
    return 0;
  }
}
