import type { OSSituacao } from "./os-situacoes";

/**
 * Formata o rótulo de uma situação/etapa de OS como "{codStatus} - {descrição}".
 * A descrição vem da API de situações cadastradas do UNO (`cadastro/cdw0050` /
 * `servico/osq0001/inicializar`). Quando nenhuma descrição estiver disponível,
 * cai para `"Etapa {codigo}"`.
 */
export function formatSituacaoLabel(
  situacao: Pick<OSSituacao, "codigo" | "codStatus" | "descricao" | "descAbrev" | "descricaoAbreviada"> | undefined | null,
): string {
  if (!situacao) return "";
  const desc =
    situacao.descricao ??
    situacao.descAbrev ??
    situacao.descricaoAbreviada;
  if (desc) return `${situacao.codStatus} - ${desc}`;
  return `Etapa ${situacao.codigo}`;
}

/** Formata `"{codStatus} - {descStatus}"` para a OS na home/listagens. */
export function formatOSStatusLabel(
  codStatus: number | undefined,
  descStatus: string | undefined,
): string | undefined {
  if (codStatus != null && descStatus) return `${codStatus} - ${descStatus}`;
  return descStatus;
}