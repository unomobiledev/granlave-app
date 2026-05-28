import { createServerFn } from "@tanstack/react-start";

/**
 * Dev-only: devolve o token UNO configurado via secret `UNO_DEV_TOKEN`.
 * Em produção (embarcado no UNO ERP), a secret fica vazia/ausente
 * e o token é lido direto do `localStorage` da origem do ERP.
 */
export const getUnoDevToken = createServerFn({ method: "GET" }).handler(async () => {
  const token = process.env.VITE_UNO_DEV_TOKEN ?? process.env.UNO_DEV_TOKEN;
  return { token: token && token.length > 0 ? token : null };
});