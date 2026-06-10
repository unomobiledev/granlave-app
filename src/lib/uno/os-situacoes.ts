import { unoGet } from "./client";

/**
 * Situações (status/etapas) cadastradas para Ordens de Serviço no UNO ERP.
 * Endpoint: GET servico/osq0001/inicializar
 */

export type OSSituacao = {
  codigo: number;
  codStatus: number;
  descricao?: string;
  descAbrev?: string;
  descricaoAbreviada?: string;
  indKanban?: boolean;
  /** TODO(UNO): confirmar se a API expõe vínculo direto com o modelo de checklist */
  idModeloChecklist?: number;
} & Record<string, unknown>;

export type OSInicializarResponse = {
  programaInfo?: Record<string, unknown>;
  situacoes: OSSituacao[];
};

export async function listarSituacoesOS(): Promise<OSSituacao[]> {
  const data = await unoGet<OSInicializarResponse>(
    "servico/osq0001/inicializar",
  );
  return data.situacoes ?? [];
}