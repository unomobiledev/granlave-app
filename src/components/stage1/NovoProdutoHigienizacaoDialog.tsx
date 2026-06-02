import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  cadastrarProdutoHigienizacao,
  type ProdutoHigienizacao,
} from "@/lib/uno/produtos-higienizacao";

export function NovoProdutoHigienizacaoDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (produto: ProdutoHigienizacao) => void;
}) {
  const queryClient = useQueryClient();
  const [codProduto, setCodProduto] = useState("");
  const [descComercial, setDescComercial] = useState("");
  const [descTecnica, setDescTecnica] = useState("");
  const [un, setUn] = useState("LT");
  const [classFiscalCodigo, setClassFiscalCodigo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave =
    codProduto.trim().length > 0 &&
    descComercial.trim().length > 0 &&
    descTecnica.trim().length > 0 &&
    un.trim().length > 0 &&
    classFiscalCodigo.trim().length > 0 &&
    !saving;

  const reset = () => {
    setCodProduto("");
    setDescComercial("");
    setDescTecnica("");
    setUn("LT");
    setClassFiscalCodigo("");
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const produto = await cadastrarProdutoHigienizacao({
        codProduto: codProduto.trim(),
        descComercial: descComercial.trim(),
        descTecnica: descTecnica.trim(),
        un: un.trim(),
        classFiscalCodigo: classFiscalCodigo.trim(),
      });
      await queryClient.invalidateQueries({
        queryKey: ["uno", "produtos-higienizacao"],
      });
      onCreated(produto);
      reset();
      onOpenChange(false);
    } catch (e) {
      setError((e as Error)?.message ?? "Erro ao cadastrar produto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar produto de higienização</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="codProduto">Código do produto</Label>
              <Input
                id="codProduto"
                value={codProduto}
                onChange={(e) => setCodProduto(e.target.value.toUpperCase())}
                placeholder="Ex: GL-002"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="un">Unidade</Label>
              <Input
                id="un"
                value={un}
                onChange={(e) => setUn(e.target.value.toUpperCase())}
                placeholder="LT"
                maxLength={6}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descComercial">Descrição comercial</Label>
            <Input
              id="descComercial"
              value={descComercial}
              onChange={(e) => setDescComercial(e.target.value)}
              placeholder="Ex: ÁLCOOL"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descTecnica">Descrição técnica</Label>
            <Input
              id="descTecnica"
              value={descTecnica}
              onChange={(e) => setDescTecnica(e.target.value)}
              placeholder="Ex: ÁLCOOL 70%"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="classFiscal">Classificação fiscal (NCM)</Label>
            <Input
              id="classFiscal"
              value={classFiscalCodigo}
              onChange={(e) =>
                setClassFiscalCodigo(e.target.value.replace(/\D/g, ""))
              }
              placeholder="Ex: 11333"
              inputMode="numeric"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? "Salvando..." : "Salvar produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}