import { useTrucksStore, isTruckInProgress } from "@/store/trucks";
import { NewTruckDialog } from "@/components/NewTruckDialog";

export function AppHeader() {
  const trucks = useTrucksStore((s) => s.trucks);
  const emAtendimento = trucks.filter(isTruckInProgress).length;
  const naFila = trucks.length - emAtendimento;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Controle de Higienização</h1>
        <p className="text-xs text-muted-foreground">
          {emAtendimento} em atendimento · {naFila} na fila
        </p>
      </div>
      <NewTruckDialog />
    </div>
  );
}