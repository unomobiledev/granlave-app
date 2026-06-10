import { DEV_OS_STATUS_ALLOWED, DEV_RESTRICT_OS_STATUS_1_6 } from "./dev-flags";
import type { OSSituacao } from "./os-situacoes";

export type EtapaEstado = "concluido" | "atual" | "pendente";

export type EtapaTimeline = {
  situacao: OSSituacao;
  estado: EtapaEstado;
};

/**
 * Constrói a timeline de etapas da OS a partir das situações cadastradas
 * e do `codStatus` atual da OS.
 *
 * Premissa: como só se avança preenchendo o checklist de cada etapa,
 * todas as etapas anteriores ao status atual são consideradas concluídas.
 */
export function buildEtapas(
  situacoes: OSSituacao[],
  codStatusAtual: number | undefined,
): EtapaTimeline[] {
  return situacoes
    .filter(
      (s) =>
        !DEV_RESTRICT_OS_STATUS_1_6 ||
        (DEV_OS_STATUS_ALLOWED as readonly number[]).includes(s.codigo),
    )
    .sort((a, b) => a.codigo - b.codigo)
    .map((situacao) => {
      let estado: EtapaEstado = "pendente";
      if (codStatusAtual != null) {
        if (situacao.codigo < codStatusAtual) estado = "concluido";
        else if (situacao.codigo === codStatusAtual) estado = "atual";
      }
      return { situacao, estado };
    });
}