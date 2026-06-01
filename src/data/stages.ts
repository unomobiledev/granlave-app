export type ChecklistItem = {
  id: string;
  label: string;
  type?: "check" | "text" | "select" | "oknok";
  placeholder?: string;
  options?: string[];
  group?: string;
};

export type Stage = {
  id: number;
  name: string;
  description: string;
  checklist: ChecklistItem[];
};

export const STAGES: Stage[] = [
  {
    id: 1,
    name: "Recepção do Motorista",
    description: "Administrativo — abertura da Ordem de Serviço",
    checklist: [
      { id: "tipo_veiculo", label: "Tipo de veículo", type: "text" },
      { id: "placa_1", label: "Placa 1", type: "text" },
      { id: "cliente_id", label: "Cliente", type: "text" },
      { id: "motorista", label: "Nome do motorista", type: "text" },
      { id: "transportador", label: "Transportador", type: "text" },
      { id: "industria", label: "Indústria de carregamento", type: "text" },
      { id: "produto_higienizar", label: "Produto a higienizar", type: "text" },
      { id: "ultima_carga", label: "Última carga", type: "text" },
      { id: "sistema_higienizacao", label: "Sistema de higienização", type: "text" },
      { id: "produto_higienizacao", label: "Produto de higienização", type: "text" },
      { id: "anvisa", label: "Registro Anvisa", type: "text" },
      { id: "lote", label: "Nº do lote", type: "text" },
      { id: "posicao_fila", label: "Posição na fila", type: "text" },
    ],
  },
  {
    id: 2,
    name: "Lavagem",
    description: "Lavagem do tanque (operador sem acesso ao sistema)",
    checklist: [
      { id: "lav_rampa", label: "Rampa de lavagem", type: "select", options: ["Rampa 1", "Rampa 2", "Rampa 3", "Rampa 4"] },
      { id: "lav_operador", label: "Nome do operador", type: "text", placeholder: "Operador da lavagem" },
      { id: "lav_residuo", label: "Verificação de sobra de resíduo", type: "oknok" },
      { id: "lav_vapor", label: "Aplicação de vapor", type: "oknok" },
      { id: "lav_enxague1", label: "Enxágue com água quente (excesso de resíduo)", type: "oknok" },
      { id: "lav_detergente", label: "Aplicação de detergente", type: "oknok" },
      { id: "lav_enxague_final", label: "Higienização final com enxágue em água quente", type: "oknok" },
      { id: "lav_valvulas", label: "Higienização de válvulas", type: "oknok" },
      { id: "lav_mangueiras", label: "Verificação e limpeza das mangueiras de descarga", type: "oknok" },
    ],
  },
  {
    id: 3,
    name: "Secagem",
    description: "Secagem do tanque (operador sem acesso ao sistema)",
    checklist: [
      { id: "sec_rampa", label: "Rampa de secagem", type: "select", options: ["Rampa 1", "Rampa 2", "Rampa 3", "Rampa 4"] },
      { id: "sec_operador", label: "Nome do secador", type: "text", placeholder: "Operador da secagem" },
      { id: "sec_ventilacao", label: "Secagem por ventilação forçada", type: "oknok" },
      { id: "sec_revalvulas", label: "Re-higienização de válvulas, conexões e mangueiras", type: "oknok" },
      { id: "sec_vedacoes", label: "Avaliação de condições técnicas das vedações", type: "oknok" },
    ],
  },
  {
    id: 4,
    name: "Liberação Final",
    description: "Inspeção, lacres e liberação da documentação",
    checklist: [
      { id: "lib_interna", label: "Verificação interna do tanque (sujidades/umidade)", type: "oknok" },
      { id: "lib_borracha", label: "Borracha de vedação da boca de visita OK", type: "oknok" },
      { id: "lib_lacre_boca", label: "Lacre da boca de visita", type: "text", placeholder: "Nº do lacre" },
      { id: "lib_valvulas_seg", label: "Verificação das válvulas de segurança", type: "oknok" },
      { id: "lib_lacre_valvulas_seg", label: "Lacre das válvulas de segurança", type: "text", placeholder: "Nº do lacre" },
      { id: "lib_alcool", label: "Aplicação de Álcool 70% em tubulações e válvulas de descarga", type: "oknok" },
      { id: "lib_lacre_descarga", label: "Lacre das válvulas de descarga", type: "text", placeholder: "Nº do lacre" },
      { id: "lib_dreno", label: "Verificação da válvula do dreno de amostragem", type: "oknok" },
      { id: "lib_lacre_dreno", label: "Lacre do dreno de amostragem", type: "text", placeholder: "Nº do lacre" },
      { id: "lib_mangote", label: "Verificação do mangote e suporte", type: "oknok" },
      { id: "lib_lacre_mangote", label: "Lacre do suporte do mangote", type: "text", placeholder: "Nº do lacre" },
      { id: "lib_utensilios", label: "Conferência de utensílios devolvidos", type: "oknok" },
      { id: "lib_fotos", label: "Registro fotográfico das etapas anexado", type: "oknok" },
      { id: "lib_liberador", label: "Nome do liberador", type: "text", placeholder: "Nome do liberador" },
      { id: "lib_assinatura", label: "Assinatura do liberador", type: "text", placeholder: "Assinatura" },
      { id: "lib_documentacao", label: "Documentação liberada / Certificado emitido", type: "oknok" },
    ],
  },
];

export const getStage = (id: number) => STAGES.find((s) => s.id === id);