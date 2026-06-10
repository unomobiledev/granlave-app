import type { ReactNode } from "react";
import { useTrucksStore, isTruckInProgress } from "@/store/trucks";
import { NewTruckDialog } from "@/components/NewTruckDialog";

export function AppHeader({ extra }: { extra?: ReactNode }) {
  const trucks = useTrucksStore((s) => s.trucks);
  const emAtendimento = trucks.filter(isTruckInProgress).length;
  const naFila = trucks.length - emAtendimento;

  return (
    <div className="border-b border-neutral-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Controle de Higienização</h1>
          <p className="text-xs text-muted-foreground">
            {emAtendimento} em atendimento · {naFila} na fila
          </p>
        </div>
        <NewTruckDialog />
      </div>
      {extra ? <div className="mt-4">{extra}</div> : null}
    </div>
  );
}