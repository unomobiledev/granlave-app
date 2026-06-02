import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type ProdutoHigienizacao } from "@/lib/uno/produtos-higienizacao";
import { ProdutoHigienizacaoSearchDialog } from "./ProdutoHigienizacaoSearchDialog";
import { NovoProdutoHigienizacaoDialog } from "./NovoProdutoHigienizacaoDialog";

export function ProdutoHigienizacaoPicker({
  onSelect,
  selected,
}: {
  onSelect: (produto: ProdutoHigienizacao) => void;
  selected?: ProdutoHigienizacao;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [novoOpen, setNovoOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Card className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          {selected && selected.codProduto ? (
            <>
              <div className="truncate text-sm font-semibold text-foreground">
                {selected.descComercial}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {selected.codProduto}
                {selected.un ? ` · ${selected.un}` : ""}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Nenhum produto selecionado
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Buscar produto"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Cadastrar novo produto"
          onClick={() => setNovoOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </Card>

      <ProdutoHigienizacaoSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={onSelect}
      />
      <NovoProdutoHigienizacaoDialog
        open={novoOpen}
        onOpenChange={setNovoOpen}
        onCreated={(p) => onSelect(p)}
      />
    </div>
  );
}