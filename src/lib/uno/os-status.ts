import { unoPut } from "./client";
import { isMockOn } from "./mock-mode";

/**
 * Avança o `codStatus` de uma OS no UNO ERP.
 *
 * Endpoint canônico (CURL fornecido pelo cliente):
 *
 *   PUT servico/osk0001/{codOs}/{codAtendimento}?codStatus={novoCodStatus}
 *
 * Mesma chamada serve para:
 *   - avançar etapa sequencialmente (ex.: 2 → 3, 3 → 4, ...)
 *   - finalizar antecipadamente (codStatus = 6, Concluída)
 *
 * Não envia body. A resposta do UNO é descartada (atualizamos via
 * invalidação dos queries de OS / situações).
 */

export type AvancarStatusOSInput = {
  codOs: string | number;
  codAtendimento: number;
  novoCodStatus: number;
};

export async function avancarStatusOS({
  codOs,
  codAtendimento,
  novoCodStatus,
}: AvancarStatusOSInput): Promise<void> {
  if (isMockOn()) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }
  await unoPut<unknown>(
    `servico/osk0001/${encodeURIComponent(String(codOs))}/${encodeURIComponent(
      String(codAtendimento),
    )}?codStatus=${encodeURIComponent(String(novoCodStatus))}`,
  );
}

/** Código de status que representa "Concluída / Liberação final" no UNO. */
export const COD_STATUS_CONCLUIDA = 6;