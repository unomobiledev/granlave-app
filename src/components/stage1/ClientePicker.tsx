import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type Cliente } from "@/lib/uno/clientes";
import { NovoClienteDialog } from "./NovoClienteDialog";
import { ClienteSearchDialog } from "./ClienteSearchDialog";

export function ClientePicker({
  onSelect,
  selected,
  autoFocus: _autoFocus,
}: {
  onSelect: (cliente: Cliente) => void;
  selected?: Cliente;
  autoFocus?: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [novoOpen, setNovoOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Card className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <div className="truncate text-sm font-semibold text-foreground">
                {selected.razaoSocial}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {selected.nomeFantasia}
                {selected.cnpj ? ` · ${selected.cnpj}` : ""}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Nenhum cliente selecionado
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Buscar cliente"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
      </Card>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => setNovoOpen(true)}
      >
        <UserPlus className="h-4 w-4" /> Cadastrar novo cliente
      </Button>

      <ClienteSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={onSelect}
      />
      <NovoClienteDialog
        open={novoOpen}
        onOpenChange={setNovoOpen}
        initialQuery=""
        onCreated={(c) => onSelect(c)}
      />
    </div>
  );
}