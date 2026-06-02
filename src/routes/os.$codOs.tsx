import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buscarOSPorCodigo, type OSDetalhe } from "@/lib/uno/os-detalhe";

const osDetalheQueryOptions = (codOs: string, codAtendimento: number) =>
  queryOptions({
    queryKey: ["uno", "os", "detalhe", codOs, codAtendimento],
    queryFn: () => buscarOSPorCodigo(codOs, codAtendimento),
  });

type OSDetalheSearch = { atend: number };

function validateOSDetalheSearch(input: Record<string, unknown>): OSDetalheSearch {
  const raw = input?.atend;
  const n = typeof raw === "number" ? raw : Number(raw);
  return { atend: Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0 };
}

export const Route = createFileRoute("/os/$codOs")({
  validateSearch: validateOSDetalheSearch,
  head: ({ params }) => ({
    meta: [{ title: `OS ${params.codOs} — GranLave` }],
  }),
  loaderDeps: ({ search }) => ({ atend: search.atend }),
  loader: ({ params, deps, context }) => {
    if (!deps.atend) return;
    return context.queryClient.ensureQueryData(
      osDetalheQueryOptions(params.codOs, deps.atend),
    );
  },
  errorComponent: ({ error }) => (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Não foi possível carregar a OS.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(error as Error)?.message ?? "Erro desconhecido"}
          </p>
        </Card>
      </main>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card className="p-4 text-sm">OS não encontrada.</Card>
      </main>
    </div>
  ),
  component: OSDetalhePage,
});

function OSDetalhePage() {
  const { codOs } = Route.useParams();
  const { atend } = Route.useSearch();

  if (!atend) {
    return (
      <div className="min-h-full bg-muted/30">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-6 py-8">
          <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">
              Atendimento não informado.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              É necessário acessar a OS pela lista para incluir o código de atendimento.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const { data } = useSuspenseQuery(osDetalheQueryOptions(codOs, atend));

  return (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Ordem de Serviço
          </div>
          <h1 className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {String(data.numero ?? data.codOs)}
          </h1>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Info label="Placa" value={data.placa} />
            <Info label="Cliente" value={formatCliente(data)} />
            <Info label="Status" value={data.status} />
            <Info label="Categoria" value={data.descricaoCategoria ?? data.categoria} />
            <Info label="Abertura" value={formatDate(data.dtAbertura)} />
            <Info label="Previsão" value={formatDate(data.dtPrevisaoConclusao)} />
            <Info label="Contato" value={data.nomeContato} />
            <Info
              label="Telefone"
              value={data.telefone ? `(${data.ddd ?? ""}) ${data.telefone}` : undefined}
            />
          </div>
        </Card>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Raw UNO (debug)
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-3 text-[11px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>

        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link to="/">Voltar ao painel</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-foreground">
        {value === undefined || value === null || value === "" ? "—" : String(value)}
      </div>
    </div>
  );
}

function formatCliente(os: OSDetalhe): string | undefined {
  if (typeof os.cliente === "string") return os.cliente;
  if (os.cliente && typeof os.cliente === "object") {
    return os.cliente.nome ?? os.cliente.razaoSocial;
  }
  return undefined;
}

function formatDate(value: unknown): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}