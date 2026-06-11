import type { OSSituacao } from "./os-situacoes";

export function mockListarSituacoesOS(): OSSituacao[] {
  return [
    { codigo: 1, codStatus: 1, descricao: "Abertura da OS",        descAbrev: "Abertura",      indKanban: true, idModeloChecklist: 1 },
    { codigo: 2, codStatus: 2, descricao: "Aguardando na fila",    descAbrev: "Fila",          indKanban: true },
    { codigo: 3, codStatus: 3, descricao: "Pré-lavagem",           descAbrev: "Pré-lavagem",   indKanban: true, idModeloChecklist: 3 },
    { codigo: 4, codStatus: 4, descricao: "Higienização interna",  descAbrev: "Higienização",  indKanban: true, idModeloChecklist: 4 },
    { codigo: 5, codStatus: 5, descricao: "Secagem e inspeção",    descAbrev: "Secagem",       indKanban: true, idModeloChecklist: 5 },
    { codigo: 6, codStatus: 6, descricao: "Liberação / Concluída", descAbrev: "Concluída",     indKanban: true, idModeloChecklist: 6 },
  ];
}