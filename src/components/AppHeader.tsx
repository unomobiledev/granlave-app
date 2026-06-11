import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Home, Settings } from "lucide-react";
import { useTrucksStore, isTruckInProgress } from "@/store/trucks";
import { NewTruckDialog } from "@/components/NewTruckDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMockMode } from "@/lib/uno/mock-mode";

export function AppHeader({ extra }: { extra?: ReactNode }) {
  const trucks = useTrucksStore((s) => s.trucks);
  const emAtendimento = trucks.filter(isTruckInProgress).length;
  const naFila = trucks.length - emAtendimento;
  const { enabled: mockOn, setEnabled: setMockOn } = useMockMode();
  const queryClient = useQueryClient();

  const handleToggleMock = (on: boolean) => {
    setMockOn(on);
    queryClient.invalidateQueries();
  };

  return (
    <div className="border-b border-neutral-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Controle de Higienização</h1>
            {mockOn ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Mock
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {emAtendimento} em atendimento · {naFila} na fila
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="mock-mode-toggle"
              checked={mockOn}
              onCheckedChange={handleToggleMock}
            />
            <Label htmlFor="mock-mode-toggle" className="cursor-pointer text-xs text-muted-foreground">
              Modo mock
            </Label>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/" aria-label="Ir para a home">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/configuracoes/checklist" className="gap-1">
              <Settings className="h-3.5 w-3.5" /> Configurações
            </Link>
          </Button>
          <NewTruckDialog />
        </div>
      </div>
      {extra ? <div className="mt-4">{extra}</div> : null}
    </div>
  );
}