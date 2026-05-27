import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STAGES } from "@/data/stages";

export type OkNok = { status: "ok" | "nok"; nc?: string };
export type ChecklistValue = boolean | string | OkNok;

export type Truck = {
  id: string;
  os?: string;
  placa: string;
  cliente: string;
  motorista: string;
  stageId: number;
  enteredStageAt: number;
  createdAt: number;
  // checklist state per stage: { [stageId]: { [itemId]: ChecklistValue } }
  checklists: Record<number, Record<string, ChecklistValue>>;
};

type State = {
  trucks: Truck[];
  completed: Truck[];
  osCounter: number;
  addTruck: (data: { placa: string; cliente: string; motorista: string; os?: string }) => void;
  setChecklistItem: (truckId: string, stageId: number, itemId: string, value: ChecklistValue) => void;
  advanceStage: (truckId: string) => void;
  removeTruck: (truckId: string) => void;
  seedMock: () => void;
  resetMock: () => void;
};

export const useTrucksStore = create<State>()(
  persist(
    (set) => ({
      trucks: [],
      completed: [],
      osCounter: 2345,
      addTruck: ({ placa, cliente, motorista, os }) =>
        set((s) => {
          const manualOs = os && os.trim().length > 0 ? os.trim() : undefined;
          return {
            trucks: [
              ...s.trucks,
              {
                id: crypto.randomUUID(),
                os: manualOs,
                placa,
                cliente,
                motorista,
                stageId: 1,
                enteredStageAt: Date.now(),
                createdAt: Date.now(),
                checklists: {},
              },
            ],
          };
        }),
      setChecklistItem: (truckId, stageId, itemId, value) =>
        set((s) => {
          return {
            trucks: s.trucks.map((t) =>
              t.id === truckId
                ? {
                    ...t,
                    checklists: {
                      ...t.checklists,
                      [stageId]: { ...(t.checklists[stageId] ?? {}), [itemId]: value },
                    },
                  }
                : t,
            ),
          };
        }),
      advanceStage: (truckId) =>
        set((s) => {
          const truck = s.trucks.find((t) => t.id === truckId);
          if (!truck) return s;
          const next = truck.stageId + 1;
          const shouldOpenOs = truck.stageId === 1 && !truck.os;
          const nextCounter = shouldOpenOs ? s.osCounter + 1 : s.osCounter;
          const newOs = shouldOpenOs ? `OS-${nextCounter}` : truck.os;
          if (next > STAGES.length) {
            return {
              osCounter: nextCounter,
              trucks: s.trucks.filter((t) => t.id !== truckId),
              completed: [...s.completed, { ...truck, os: newOs, stageId: STAGES.length }],
            };
          }
          return {
            osCounter: nextCounter,
            trucks: s.trucks.map((t) =>
              t.id === truckId ? { ...t, os: newOs, stageId: next, enteredStageAt: Date.now() } : t,
            ),
          };
        }),
      removeTruck: (truckId) =>
        set((s) => ({ trucks: s.trucks.filter((t) => t.id !== truckId) })),
      seedMock: () =>
        set((s) => {
          if (s.trucks.length > 0) return s;
          const seeded = buildMockTrucks();
          const maxOs = seeded.reduce((m, t) => {
            const n = parseInt((t.os ?? "").replace(/\D/g, ""), 10);
            return Number.isFinite(n) ? Math.max(m, n) : m;
          }, s.osCounter);
          return { trucks: seeded, osCounter: maxOs };
        }),
      resetMock: () =>
        set(() => {
          const seeded = buildMockTrucks();
          const maxOs = seeded.reduce((m, t) => {
            const n = parseInt((t.os ?? "").replace(/\D/g, ""), 10);
            return Number.isFinite(n) ? Math.max(m, n) : m;
          }, 2345);
          return { trucks: seeded, completed: [], osCounter: maxOs };
        }),
    }),
    { name: "granlave-trucks-v8" },
  ),
);

function buildMockTrucks(): Truck[] {
  const now = Date.now();
  const min = 60_000;
  const partial = (stageId: number, ratio: number): Record<number, Record<string, ChecklistValue>> => {
    const stage = STAGES.find((s) => s.id === stageId);
    if (!stage) return {};
    const count = Math.max(1, Math.floor(stage.checklist.length * ratio));
    const state: Record<string, ChecklistValue> = {};
    stage.checklist.slice(0, count).forEach((item) => {
      if (item.type === "text") state[item.id] = item.placeholder ?? "—";
      else if (item.type === "select") state[item.id] = item.options?.[0] ?? "";
      else if (item.type === "oknok") state[item.id] = { status: "ok" };
      else state[item.id] = true;
    });
    return { [stageId]: state };
  };

  return [
    // Em atendimento (4)
    {
      id: crypto.randomUUID(),
      os: "OS-2346",
      placa: "SEW-5H07",
      cliente: "Via Group Participações",
      motorista: "João Pereira",
      stageId: 1,
      enteredStageAt: now - 8 * min,
      createdAt: now - 50 * min,
      checklists: partial(1, 0.5),
    },
    {
      id: crypto.randomUUID(),
      os: "OS-2347",
      placa: "RKL-2D89",
      cliente: "Cargill Agrícola",
      motorista: "Marcos Silva",
      stageId: 2,
      enteredStageAt: now - 14 * min,
      createdAt: now - 75 * min,
      checklists: { ...partial(1, 1), ...partial(2, 0.4) },
    },
    {
      id: crypto.randomUUID(),
      os: "OS-2348",
      placa: "QPM-7B34",
      cliente: "BRF S.A.",
      motorista: "Rafael Costa",
      stageId: 3,
      enteredStageAt: now - 22 * min,
      createdAt: now - 110 * min,
      checklists: { ...partial(1, 1), ...partial(2, 1), ...partial(3, 0.6) },
    },
    {
      id: crypto.randomUUID(),
      os: "OS-2349",
      placa: "TGH-9E12",
      cliente: "Bunge Alimentos",
      motorista: "Eduardo Lima",
      stageId: 4,
      enteredStageAt: now - 5 * min,
      createdAt: now - 165 * min,
      checklists: { ...partial(1, 1), ...partial(2, 1), ...partial(3, 1), ...partial(4, 0.4) },
    },
    // Na fila (3) — nenhum item marcado, stageId=1
    {
      id: crypto.randomUUID(),
      placa: "ABC-1A23",
      cliente: "JBS Foods",
      motorista: "Paulo Souza",
      stageId: 1,
      enteredStageAt: now - 3 * min,
      createdAt: now - 12 * min,
      checklists: {},
    },
    {
      id: crypto.randomUUID(),
      placa: "DEF-4B56",
      cliente: "Marfrig",
      motorista: "Cláudio Ramos",
      stageId: 1,
      enteredStageAt: now - 2 * min,
      createdAt: now - 7 * min,
      checklists: {},
    },
    {
      id: crypto.randomUUID(),
      placa: "GHI-7C89",
      cliente: "Minerva Foods",
      motorista: "Anderson Dias",
      stageId: 1,
      enteredStageAt: now - 1 * min,
      createdAt: now - 3 * min,
      checklists: {},
    },
  ];
}

export function nextOsSuggestion(counter: number) {
  return `OS-${counter + 1}`;
}

export function isTruckInProgress(truck: Truck) {
  const state = truck.checklists[truck.stageId] ?? {};
  return Object.values(state).some(
    (v) =>
      v === true ||
      (typeof v === "string" && v.trim().length > 0) ||
      (typeof v === "object" && v !== null && "status" in v),
  );
}

export function isChecklistComplete(truck: Truck, stageId: number) {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return false;
  const state = truck.checklists[stageId] ?? {};
  return stage.checklist.every((item) => {
    const v = state[item.id];
    if (item.type === "text" || item.type === "select")
      return typeof v === "string" && v.trim().length > 0;
    if (item.type === "oknok") {
      if (typeof v !== "object" || v === null || !("status" in v)) return false;
      const ok = v as OkNok;
      if (ok.status === "ok") return true;
      return ok.status === "nok" && !!ok.nc && ok.nc.trim().length > 0;
    }
    return v === true;
  });
}

export function checklistProgress(truck: Truck, stageId: number) {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return { done: 0, total: 0 };
  const state = truck.checklists[stageId] ?? {};
  const done = stage.checklist.filter((item) => {
    const v = state[item.id];
    if (item.type === "text" || item.type === "select")
      return typeof v === "string" && v.trim().length > 0;
    if (item.type === "oknok") {
      if (typeof v !== "object" || v === null || !("status" in v)) return false;
      const ok = v as OkNok;
      if (ok.status === "ok") return true;
      return ok.status === "nok" && !!ok.nc && ok.nc.trim().length > 0;
    }
    return v === true;
  }).length;
  return { done, total: stage.checklist.length };
}