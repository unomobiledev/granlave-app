import { useEffect, useState } from "react";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { buscarClientes, type Cliente } from "@/lib/uno/clientes";
import { NovoClienteDialog } from "./NovoClienteDialog";

export function ClientePicker({
  onSelect,
  autoFocus,
}: {
  onSelect: (cliente: Cliente) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await buscarClientes(query);
        if (!cancelled) setResults(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por razão social, fantasia ou CNPJ..."
          className="pl-9"
        />
      </div>

      <Card className="max-h-64 overflow-auto p-1">
        {loading ? (
          <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
          </div>
        ) : results.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground">
            Nenhum cliente encontrado.
          </div>
        ) : (
          results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span className="font-medium text-foreground">{c.razaoSocial}</span>
              <span className="text-xs text-muted-foreground">
                {c.nomeFantasia} · {c.cnpj}
              </span>
            </button>
          ))
        )}
      </Card>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => setDialogOpen(true)}
      >
        <UserPlus className="h-4 w-4" /> Cadastrar novo cliente
      </Button>

      <NovoClienteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialQuery={query}
        onCreated={(c) => onSelect(c)}
      />
    </div>
  );
}