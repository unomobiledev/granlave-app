/**
 * Modo Mock global.
 *
 * Quando ligado, todas as funções de leitura dos módulos `lib/uno/*`
 * devolvem dados de mockup ao invés de chamar o ERP UNO. Útil para
 * desenvolver/demonstrar a aplicação fora do iframe do ERP, sem token
 * válido, ou quando o backend está fora do ar.
 *
 * - Persistido em `localStorage.granlave_mock` (`"on" | "off"`)
 * - `useMockMode()`     → hook reativo para componentes
 * - `isMockOn()`        → leitura síncrona em código não-React
 * - `withMockFallback()` → helper para curto-circuitar uma função real
 */

const KEY = "granlave_mock";
const EVENT = "granlave-mock-mode-changed";

function readRaw(): "on" | "off" {
  if (typeof window === "undefined") return "off";
  try {
    return window.localStorage.getItem(KEY) === "on" ? "on" : "off";
  } catch {
    return "off";
  }
}

export function isMockOn(): boolean {
  return readRaw() === "on";
}

export function setMockOn(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Subscribe a callback para mudanças no toggle. Retorna unsubscribe. */
export function subscribeMockMode(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Executa `mock()` quando o toggle estiver ligado; caso contrário, `real()`.
 * Sem fallback automático em erro — o controle é exclusivamente do toggle.
 */
export function withMockFallback<T>(
  real: () => Promise<T>,
  mock: () => T | Promise<T>,
): Promise<T> {
  if (isMockOn()) return Promise.resolve(mock());
  return real();
}

/* ===== React hook ===== */
import { useSyncExternalStore } from "react";

export function useMockMode(): {
  enabled: boolean;
  setEnabled: (on: boolean) => void;
  toggle: () => void;
} {
  const enabled = useSyncExternalStore(
    subscribeMockMode,
    () => readRaw() === "on",
    () => false,
  );
  return {
    enabled,
    setEnabled: setMockOn,
    toggle: () => setMockOn(!enabled),
  };
}