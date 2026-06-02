import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listarClientesPaginado, type Cliente } from "@/lib/uno/clientes";

const PAGE_SIZE = 20;

export function ClienteSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (cliente: Cliente) => void;
}) {
  const [page, setPage] = useState(0);

  const q = useQuery({
    queryKey: ["uno", "clientes", "page", page, PAGE_SIZE],
    queryFn: () => listarClientesPaginado({ page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    enabled: open,
  });

  const data = q.data;
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const handleSelect = (c: Cliente) => {
    onSelect(c);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Selecionar cliente</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão social</TableHead>
                <TableHead>Fantasia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead className="w-16 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isLoading && !data ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : q.isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm">
                    <p className="text-destructive">
                      Falha ao carregar clientes: {(q.error as Error)?.message ?? "erro desconhecido"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => q.refetch()}
                    >
                      Tentar novamente
                    </Button>
                  </TableCell>
                </TableRow>
              ) : data && data.items.length > 0 ? (
                data.items.map((c, i) => {
                  const u = data.raw[i];
                  const cidade = u?.cidade
                    ? `${u.cidade}${u.siglaUf ? `/${u.siglaUf}` : ""}`
                    : "—";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.razaoSocial}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.nomeFantasia}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.cnpj || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {cidade}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSelect(c)}
                          aria-label={`Selecionar ${c.razaoSocial}`}
                        >
                          <Check className="h-4 w-4 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Página {(data?.page ?? page) + 1} de {Math.max(totalPages, 1)}
            </span>
            <span>·</span>
            <span>{totalElements} clientes</span>
            {q.isFetching ? <Loader2 className="ml-2 h-3 w-3 animate-spin" /> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page === 0 || q.isFetching}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page >= totalPages - 1 || q.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Próximo <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}