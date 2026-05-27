import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getUnoDevToken } from "@/lib/uno/dev-token.functions";

/**
 * Dev-only bootstrap: se o `localStorage` não tem `token`, busca o token
 * da secret `UNO_DEV_TOKEN` via server function e grava no localStorage.
 * Em produção (dentro do iframe do UNO), a secret está vazia e este
 * componente vira no-op — o token já foi escrito pelo próprio ERP.
 */
export function UnoDevTokenBootstrap() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("token")) return;

    let cancelled = false;
    getUnoDevToken()
      .then(({ token }) => {
        if (cancelled || !token) return;
        window.localStorage.setItem("token", token);
        queryClient.invalidateQueries({ queryKey: ["uno"] });
      })
      .catch((err) => {
        console.warn("[UnoDevTokenBootstrap] não foi possível obter token dev:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  return null;
}