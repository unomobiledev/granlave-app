import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Package,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listarProdutosHigienizacao,
  type ProdutoHigienizacao,
} from "@/lib/uno/produtos-higienizacao";

const PAGE_SIZES = [10, 20, 50, 100] as const;

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function ProdutoHigienizacaoSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (produto: ProdutoHigienizacao) => void;
}) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<number>(20);
  const [filterInput, setFilterInput] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setFilter(filterInput), 200);
    return () => clearTimeout(t);
  }, [filterInput]);

  useEffect(() => {
    if (open) {
      setPage(0);
      setFilterInput("");
      setFilter("");
    }
  }, [open]);

  const q = useQuery({
    queryKey: ["uno", "produtos-higienizacao", "page", page, size],
    queryFn: () => listarProdutosHigienizacao({ page, size }),
    placeholderData: keepPreviousData,
    enabled: open,
  });

  const data = q.data;
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;
  const currentPage = data?.page ?? page;

  const rows = useMemo(() => {
    if (!data) return [] as ProdutoHigienizacao[];
    if (!filter.trim()) return data.items;
    const term = normalize(filter.trim());
    return data.items.filter(
      (p) =>
        normalize(p.descComercial).includes(term) ||
        normalize(p.descTecnica).includes(term) ||
        normalize(p.codProduto).includes(term),
    );
  }, [data, filter]);

  const handleSelect = (p: ProdutoHigienizacao) => {
    onSelect(p);
    onOpenChange(false);
  };

  const rangeStart = totalElements === 0 ? 0 : currentPage * size + 1;
  const rangeEnd = Math.min((currentPage + 1) * size, totalElements);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <div className="shrink-0 border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg">Selecionar produto de higienização</DialogTitle>
              <DialogDescription className="text-xs">
                Lista de produtos disponíveis no UNO ERP.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              <span>
                <span className="font-semibold text-foreground">{totalElements.toLocaleString("pt-BR")}</span>{" "}
                produtos
              </span>
              {q.isFetching && data ? (
                <span className="ml-2 flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> atualizando…
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                placeholder="Filtrar por código ou descrição…"
                className="pl-9"
              />
            </div>
            <span className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:block">
              filtra apenas a página atual
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
              <TableRow>
                <TableHead className="w-28">Código</TableHead>
                <TableHead>Descrição comercial</TableHead>
                <TableHead>Descrição técnica</TableHead>
                <TableHead className="w-16">UN</TableHead>
                <TableHead className="w-16 text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isLoading && !data ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : q.isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm">
                    <p className="text-destructive">
                      Falha ao carregar produtos:{" "}
                      {(q.error as Error)?.message ?? "erro desconhecido"}
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
              ) : rows.length > 0 ? (
                rows.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSelect(p)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {p.codProduto}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {p.descComercial}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.descTecnica}
                    </TableCell>
                    <TableCell className="text-xs">{p.un || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(p);
                        }}
                        aria-label={`Selecionar ${p.descComercial}`}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {filter
                      ? "Nenhum produto encontrado nesta página com esse filtro."
                      : "Nenhum produto encontrado."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="shrink-0 border-t bg-muted/30 px-6 py-3">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Exibindo{" "}
              <span className="font-medium text-foreground">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              de{" "}
              <span className="font-medium text-foreground">
                {totalElements.toLocaleString("pt-BR")}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Por página</span>
              <Select
                value={String(size)}
                onValueChange={(v) => {
                  setSize(Number(v));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 0 || q.isFetching}
                onClick={() => setPage(0)}
                aria-label="Primeira página"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 0 || q.isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-3 text-xs text-muted-foreground">
                Página{" "}
                <span className="font-medium text-foreground">
                  {currentPage + 1}
                </span>{" "}
                de{" "}
                <span className="font-medium text-foreground">
                  {Math.max(totalPages, 1)}
                </span>
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages - 1 || q.isFetching}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages - 1 || q.isFetching}
                onClick={() => setPage(Math.max(0, totalPages - 1))}
                aria-label="Última página"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}