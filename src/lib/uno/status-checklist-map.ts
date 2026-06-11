/**
 * De-para configurável entre o `codStatus` da OS e o `idModeloChecklist`
 * usado para carregar as perguntas em `cadastro/cdd0372`.
 *
 * Persistido em `localStorage.granlave_status_checklist_map` para sobreviver
 * a recarregamentos sem depender do ERP — quando/se o UNO expuser uma
 * entidade própria para esse vínculo, migramos para endpoint.
 */
import { useSyncExternalStore } from "react";

export type StatusChecklistMap = Record<number, number>;

const KEY = "granlave_status_checklist_map";
const EVENT = "granlave-status-checklist-map-changed";

/** Defaults pedidos pelo usuário: Status 3/4/5 → Checklists 1/2/3. */
export const DEFAULT_STATUS_CHECKLIST_MAP: StatusChecklistMap = {
  3: 1,
  4: 2,
  5: 3,
};

function readRaw(): StatusChecklistMap {
  if (typeof window === "undefined") return { ...DEFAULT_STATUS_CHECKLIST_MAP };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATUS_CHECKLIST_MAP };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_STATUS_CHECKLIST_MAP };
    }
    const out: StatusChecklistMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const status = Number(k);
      const id = Number(v);
      if (Number.isFinite(status) && Number.isFinite(id) && id > 0) {
        out[status] = id;
      }
    }
    return out;
  } catch {
    return { ...DEFAULT_STATUS_CHECKLIST_MAP };
  }
}

/** Snapshot estável: mesma referência enquanto o conteúdo não muda. */
let cachedSnapshot: StatusChecklistMap = readRaw();
function refreshSnapshot() {
  cachedSnapshot = readRaw();
}

export function getStatusChecklistMap(): StatusChecklistMap {
  return cachedSnapshot;
}

export function setStatusChecklistMap(map: StatusChecklistMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  refreshSnapshot();
  window.dispatchEvent(new Event(EVENT));
}

export function resetStatusChecklistMap(): void {
  setStatusChecklistMap({ ...DEFAULT_STATUS_CHECKLIST_MAP });
}

/** Retorna o `idModeloChecklist` configurado para o status, ou `undefined`. */
export function getChecklistIdForStatus(
  codStatus: number | undefined,
): number | undefined {
  if (codStatus == null) return undefined;
  const id = cachedSnapshot[codStatus];
  return id && id > 0 ? id : undefined;
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    refreshSnapshot();
    cb();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useStatusChecklistMap(): {
  map: StatusChecklistMap;
  setMap: (m: StatusChecklistMap) => void;
  reset: () => void;
} {
  const map = useSyncExternalStore(
    subscribe,
    () => cachedSnapshot,
    () => cachedSnapshot,
  );
  return { map, setMap: setStatusChecklistMap, reset: resetStatusChecklistMap };
}