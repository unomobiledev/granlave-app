import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOTIVOS = [
  "Não requer secagem",
  "Não requer liberação final",
  "Solicitação do cliente",
  "Outro",
];

export function FinalizarAntecipadoDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (data: { motivo: string; justificativa: string }) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const valid = motivo.length > 0 && justificativa.trim().length >= 10;

  const handleConfirm = () => {
    if (!valid) return;
    onConfirm({ motivo, justificativa: justificativa.trim() });
    setMotivo("");
    setJustificativa("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar serviço antecipadamente</DialogTitle>
          <DialogDescription>
            Alguns tipos de caminhão não passam por Secagem e Liberação Final.
            Informe o motivo e justifique para encerrar o serviço a partir desta
            etapa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="motivo-antecipado">Motivo</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger id="motivo-antecipado">
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="justificativa-antecipado">
              Justificativa <span className="text-muted-foreground">(mín. 10 caracteres)</span>
            </Label>
            <Textarea
              id="justificativa-antecipado"
              placeholder="Descreva o motivo da finalização antecipada..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!valid} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Confirmar finalização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}