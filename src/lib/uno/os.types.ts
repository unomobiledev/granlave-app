/**
 * Status das OSs no UNO ERP.
 * Cada status corresponde a um bloco da tela inicial e a uma etapa do sistema:
 *  - AGUARDANDO_FILA → bloco "Veículos na fila"          (pré-Etapa 1)
 *  - EM_ATENDIMENTO  → bloco "Veículos em atendimento"   (Etapas 1 → 4)
 *  - CONCLUIDO       → bloco "Veículos concluídos"       (pós-Etapa 4 ou finalizado antecipado)
 *
 * TODO(UNO): confirmar os valores reais (strings) usados pelo UNO e ajustar abaixo.
 */
export const OS_STATUS = {
  AGUARDANDO_FILA: "AGUARDANDO_FILA",
  EM_ATENDIMENTO: "EM_ATENDIMENTO",
  CONCLUIDO: "CONCLUIDO",
} as const;

export type OSStatus = (typeof OS_STATUS)[keyof typeof OS_STATUS];