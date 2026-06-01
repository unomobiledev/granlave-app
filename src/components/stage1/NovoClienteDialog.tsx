import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cadastrarCliente, type Cliente } from "@/lib/uno/clientes";

function maskCnpj(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function NovoClienteDialog({
  open,
  onOpenChange,
  initialQuery,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  onCreated: (cliente: Cliente) => void;
}) {
  const [nomeFantasia, setNomeFantasia] = useState(initialQuery ?? "");
  const [razaoSocial, setRazaoSocial] = useState(initialQuery ?? "");
  const [cnpj, setCnpj] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cnpjDigits = cnpj.replace(/\D/g, "");
  const canSave =
    nomeFantasia.trim().length > 0 &&
    razaoSocial.trim().length > 0 &&
    cnpjDigits.length === 14 &&
    !saving;

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const cliente = await cadastrarCliente({
        nomeFantasia: nomeFantasia.trim(),
        razaoSocial: razaoSocial.trim(),
        cnpj,
      });
      onCreated(cliente);
      setNomeFantasia("");
      setRazaoSocial("");
      setCnpj("");
      onOpenChange(false);
    } catch (e) {
      setError((e as Error)?.message ?? "Erro ao cadastrar cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar novo cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nomeFantasia">Nome fantasia</Label>
            <Input
              id="nomeFantasia"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              placeholder="Ex: Via Group"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="razaoSocial">Razão social</Label>
            <Input
              id="razaoSocial"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder="Ex: Via Group Participações Ltda"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(maskCnpj(e.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            O cadastro será enviado à UNO (mock por enquanto).
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? "Salvando..." : "Salvar cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}