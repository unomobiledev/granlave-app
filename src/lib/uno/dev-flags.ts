/**
 * Flags de desenvolvimento. Remover (ou setar `false`) no go-live.
 *
 * `DEV_RESTRICT_OS_STATUS_1_6`: restringe toda a UI aos `codStatus` 1..6
 * (etapas já modeladas). Aplica-se a:
 *   - listagens da home (`listarOSsPorStatus`)
 *   - timeline de situações no detalhe da OS (`SituacoesSection`)
 */
export const DEV_RESTRICT_OS_STATUS_1_6 = true;
export const DEV_OS_STATUS_ALLOWED = [1, 2, 3, 4, 5, 6] as const;
export type DevAllowedOSStatus = (typeof DEV_OS_STATUS_ALLOWED)[number];