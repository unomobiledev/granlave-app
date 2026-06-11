import type { ChecklistModelo, ChecklistItemModelo } from "./checklist-modelos";

export function mockListarModelosChecklist(): ChecklistModelo[] {
  return [
    { id: 1, codigo: 1, descricao: "Abertura da OS",         codSituacao: 1, codStatus: 1 },
    { id: 3, codigo: 3, descricao: "Pré-lavagem",            codSituacao: 3, codStatus: 3 },
    { id: 4, codigo: 4, descricao: "Higienização interna",   codSituacao: 4, codStatus: 4 },
    { id: 5, codigo: 5, descricao: "Secagem e inspeção",     codSituacao: 5, codStatus: 5 },
    { id: 6, codigo: 6, descricao: "Liberação",              codSituacao: 6, codStatus: 6 },
  ];
}

const ITENS_POR_MODELO: Record<number, ChecklistItemModelo[]> = {
  1: [
    { id: 101, pergunta: "Documentação do veículo conferida?",        tipoResposta: "SIM_NAO", obrigatorio: true,  ordem: 1 },
    { id: 102, pergunta: "Placa do veículo confere com a OS?",        tipoResposta: "SIM_NAO", obrigatorio: true,  ordem: 2 },
    { id: 103, pergunta: "Produto transportado identificado?",        tipoResposta: "TEXTO",   obrigatorio: true,  ordem: 3 },
  ],
  3: [
    { id: 301, pergunta: "Resíduos removidos antes do enxágue?",      tipoResposta: "SIM_NAO", obrigatorio: true,  ordem: 1 },
    { id: 302, pergunta: "Pressão da água adequada?",                 tipoResposta: "SIM_NAO", obrigatorio: false, ordem: 2 },
  ],
  4: [
    { id: 401, pergunta: "Detergente aplicado conforme procedimento?", tipoResposta: "SIM_NAO", obrigatorio: true, ordem: 1 },
    { id: 402, pergunta: "Tempo de contato respeitado?",               tipoResposta: "SIM_NAO", obrigatorio: true, ordem: 2 },
    { id: 403, pergunta: "Enxágue final realizado?",                   tipoResposta: "SIM_NAO", obrigatorio: true, ordem: 3 },
  ],
  5: [
    { id: 501, pergunta: "Tanque visualmente seco?",                  tipoResposta: "SIM_NAO", obrigatorio: true, ordem: 1 },
    { id: 502, pergunta: "Inspeção interna sem anomalias?",           tipoResposta: "SIM_NAO", obrigatorio: true, ordem: 2 },
  ],
  6: [
    { id: 601, pergunta: "Lacre aplicado?",                            tipoResposta: "SIM_NAO", obrigatorio: true, ordem: 1 },
    { id: 602, pergunta: "Certificado emitido?",                       tipoResposta: "SIM_NAO", obrigatorio: true, ordem: 2 },
  ],
};

export function mockListarItensModeloChecklist(
  idModeloChecklist: number,
): ChecklistItemModelo[] {
  return ITENS_POR_MODELO[idModeloChecklist] ?? [];
}