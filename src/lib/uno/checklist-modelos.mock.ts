import type { ChecklistModelo, ChecklistItemModelo } from "./checklist-modelos";

export function mockListarModelosChecklist(): ChecklistModelo[] {
  return [
    { id: 1, codigo: 1, descricao: "Higienização" },
    { id: 2, codigo: 2, descricao: "Secagem" },
    { id: 3, codigo: 3, descricao: "Checklist final" },
  ];
}

const ITENS_POR_MODELO: Record<number, ChecklistItemModelo[]> = {
  1: [
    { idModeloChecklistPergunta: 1, idModeloChecklist: 1, grupoPergunta: "Inspeção", pergunta: "Inspeção interna do tanque realizada?",     ordem: 10,  tipoResposta: 3, comboFixo: "Sim|Não|N/A",           descricao: "Verificar se o interior do tanque foi inspecionado." },
    { idModeloChecklistPergunta: 2, idModeloChecklist: 1, grupoPergunta: "Inspeção", pergunta: "Boca de visita limpa e inspecionada?",      ordem: 20,  tipoResposta: 3, comboFixo: "Sim|Não|N/A",           descricao: "Conferir condição da boca de visita." },
    { idModeloChecklistPergunta: 3, idModeloChecklist: 1, grupoPergunta: "Inspeção", pergunta: "Borrachas de vedação conferidas?",          ordem: 30,  tipoResposta: 3, comboFixo: "Sim|Não|N/A" },
    { idModeloChecklistPergunta: 4, idModeloChecklist: 1, grupoPergunta: "Processo", pergunta: "Temperatura da etapa de aquecimento",       ordem: 40,  tipoResposta: 2,                                     descricao: "Informar em °C." },
    { idModeloChecklistPergunta: 5, idModeloChecklist: 1, grupoPergunta: "Processo", pergunta: "Tempo da etapa de aquecimento",             ordem: 50,  tipoResposta: 2 },
    { idModeloChecklistPergunta: 6, idModeloChecklist: 1, grupoPergunta: "Processo", pergunta: "Teste de vazamento da válvula de descarga", ordem: 60,  tipoResposta: 3, comboFixo: "Aprovado|Reprovado|N/A" },
    { idModeloChecklistPergunta: 7, idModeloChecklist: 1, grupoPergunta: "Processo", pergunta: "Resultado do pH",                           ordem: 70,  tipoResposta: 2, descricao: "Faixa esperada: 6,0 a 9,0." },
    { idModeloChecklistPergunta: 8, idModeloChecklist: 1, grupoPergunta: "Não Conformidades", pergunta: "Não conformidades encontradas",    ordem: 80,  tipoResposta: 2 },
  ],
  2: [
    { idModeloChecklistPergunta: 11, idModeloChecklist: 2, grupoPergunta: "Secagem", pergunta: "Secagem por ventilação forçada concluída?", ordem: 10, tipoResposta: 1 },
    { idModeloChecklistPergunta: 12, idModeloChecklist: 2, grupoPergunta: "Secagem", pergunta: "Re-higienização de válvulas e mangueiras?", ordem: 20, tipoResposta: 1 },
    { idModeloChecklistPergunta: 13, idModeloChecklist: 2, grupoPergunta: "Inspeção", pergunta: "Tanque visualmente seco?",                 ordem: 30, tipoResposta: 3, comboFixo: "Sim|Não|N/A" },
    { idModeloChecklistPergunta: 14, idModeloChecklist: 2, grupoPergunta: "Processo", pergunta: "Tempo total de secagem (min)",             ordem: 40, tipoResposta: 2 },
  ],
  3: [
    { idModeloChecklistPergunta: 21, idModeloChecklist: 3, grupoPergunta: "Lacres", pergunta: "Número do lacre - Boca de visita",            ordem: 10, tipoResposta: 2 },
    { idModeloChecklistPergunta: 22, idModeloChecklist: 3, grupoPergunta: "Lacres", pergunta: "Número do lacre - Dreno",                     ordem: 20, tipoResposta: 2 },
    { idModeloChecklistPergunta: 23, idModeloChecklist: 3, grupoPergunta: "Lacres", pergunta: "Número do lacre - Válvula de descarga",       ordem: 30, tipoResposta: 2 },
    { idModeloChecklistPergunta: 24, idModeloChecklist: 3, grupoPergunta: "Lacres", pergunta: "Número do lacre - Mangote",                   ordem: 40, tipoResposta: 2 },
    { idModeloChecklistPergunta: 25, idModeloChecklist: 3, grupoPergunta: "Liberação", pergunta: "Certificado emitido?",                     ordem: 50, tipoResposta: 1 },
    { idModeloChecklistPergunta: 26, idModeloChecklist: 3, grupoPergunta: "Liberação", pergunta: "Documentação liberada?",                   ordem: 60, tipoResposta: 1 },
  ],
};

export function mockListarItensModeloChecklist(
  idModeloChecklist: number,
): ChecklistItemModelo[] {
  return ITENS_POR_MODELO[idModeloChecklist] ?? [];
}