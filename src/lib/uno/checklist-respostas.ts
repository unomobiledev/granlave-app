import { unoFetch, unoPost, unoPut } from "./client";

/**
 * Gravação das respostas do checklist da OS.
 *
 * - POST servico/osd0005
 *   Body: [{ id, resposta, observacao }]
 *   Insere o conjunto inicial de respostas para um modelo de checklist.
 *
 * - PUT servico/osw0001/{codOs}/{codAtendimento}/checklist/{codChecklistResposta}
 *   Atualiza uma resposta individual já existente.
 */

export type RespostaChecklistInput = {
  id: number;
  resposta: string;
  observacao?: string;
};

export function criarRespostasChecklist(
  respostas: RespostaChecklistInput[],
): Promise<unknown> {
  return unoPost("servico/osd0005", respostas);
}

export function atualizarRespostaChecklist(
  codOs: string | number,
  codAtendimento: string | number,
  codChecklistResposta: string | number,
  body: { resposta: string; observacao?: string },
): Promise<unknown> {
  return unoPut(
    `servico/osw0001/${encodeURIComponent(String(codOs))}/${encodeURIComponent(
      String(codAtendimento),
    )}/checklist/${encodeURIComponent(String(codChecklistResposta))}`,
    body,
  );
}

// re-export para evitar warning "imported but unused" se outros utilitários
// passarem a usar unoFetch diretamente
export { unoFetch };