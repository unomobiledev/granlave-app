import { useState } from "react";
import { Plus } from "lucide-react";
import { useTrucksStore } from "@/store/trucks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewTruckDialog() {
  const addTruck = useTrucksStore((s) => s.addTruck);
  const [open, setOpen] = useState(false);
  const [placa, setPlaca] = useState("");
  const [cliente, setCliente] = useState("");
  const [motorista, setMotorista] = useState("");

  const submit = () => {
    if (!placa.trim() || !cliente.trim()) return;
    addTruck({
      placa: placa.toUpperCase().trim(),
      cliente: cliente.trim(),
      motorista: motorista.trim(),
    });
    setPlaca("");
    setCliente("");
    setMotorista("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Novo caminhão
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar novo caminhão</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="placa">Placa</Label>
            <Input id="placa" value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="SEW-5H07" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Input id="cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Via Group Participações" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motorista">Motorista</Label>
            <Input id="motorista" value={motorista} onChange={(e) => setMotorista(e.target.value)} placeholder="Nome do motorista" />
          </div>
          <p className="text-xs text-muted-foreground">
            A OS será aberta automaticamente ao iniciar a Recepção.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>Iniciar Etapa 1</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}