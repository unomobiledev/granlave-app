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

/**
 * Mapa do status lógico (UI) → códigos numéricos `codStatus` do UNO usados
 * para filtrar o endpoint `servico/osq0001`.
 */
export const OS_COD_STATUS = {
  [OS_STATUS.AGUARDANDO_FILA]: [1, 2],
  [OS_STATUS.EM_ATENDIMENTO]: [3, 4, 5],
  [OS_STATUS.CONCLUIDO]: [6],
} as const satisfies Record<OSStatus, readonly number[]>;