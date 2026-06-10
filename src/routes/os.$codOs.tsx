import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { buscarOSPorCodigo, type OSDetalhe } from "@/lib/uno/os-detalhe";

export const osDetalheQueryOptions = (codOs: string, codAtendimento: number) =>
  queryOptions({
    queryKey: ["uno", "os", "detalhe", codOs, codAtendimento],
    queryFn: () => buscarOSPorCodigo(codOs, codAtendimento),
  });

type OSLayoutSearch = { atend: number };

function validateOSLayoutSearch(input: Record<string, unknown>): OSLayoutSearch {
  const raw = input?.atend;
  const n = typeof raw === "number" ? raw : Number(raw);
  return { atend: Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0 };
}

export const Route = createFileRoute("/os/$codOs")({
  validateSearch: validateOSLayoutSearch,
  loaderDeps: ({ search }: { search: OSLayoutSearch }) => ({ atend: search.atend }),
  loader: ({ params, deps, context }) => {
    if (!deps.atend) return;
    context.queryClient.ensureQueryData(
      osDetalheQueryOptions(params.codOs, deps.atend),
    );
    return;
  },
  errorComponent: ({ error }) => (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">
            Não foi possível carregar a OS.
          </p>
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
  component: OSLayout,
});

function OSLayout() {
  const { codOs } = Route.useParams();
  const { atend } = Route.useSearch();

  return (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        {atend ? (
          <OSHeaderCard codOs={codOs} atend={atend} />
        ) : (
          <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">
              Atendimento não informado.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              É necessário acessar a OS pela lista para incluir o código de atendimento.
            </p>
          </Card>
        )}

        <Outlet />
      </main>
    </div>
  );
}

function OSHeaderCard({ codOs, atend }: { codOs: string; atend: number }) {
  const { data } = useSuspenseQuery(osDetalheQueryOptions(codOs, atend));

  return (
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
        <Info
          label="Categoria"
          value={data.descricaoCategoria ?? data.categoria}
        />
        <Info label="Abertura" value={formatDate(data.dtAbertura)} />
        <Info label="Previsão" value={formatDate(data.dtPrevisaoConclusao)} />
        <Info label="Contato" value={data.nomeContato} />
        <Info
          label="Telefone"
          value={
            data.telefone ? `(${data.ddd ?? ""}) ${data.telefone}` : undefined
          }
        />
      </div>
    </Card>
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