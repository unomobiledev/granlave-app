import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Circle, CircleDot, Lock } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buscarOSPorCodigo, type OSDetalhe } from "@/lib/uno/os-detalhe";
import { listarSituacoesOS } from "@/lib/uno/os-situacoes";
import { listarModelosChecklist } from "@/lib/uno/checklist-modelos";
import { buildEtapas, type EtapaTimeline } from "@/lib/uno/os-etapas";

const osDetalheQueryOptions = (codOs: string, codAtendimento: number) =>
  queryOptions({
    queryKey: ["uno", "os", "detalhe", codOs, codAtendimento],
    queryFn: () => buscarOSPorCodigo(codOs, codAtendimento),
  });

const situacoesQueryOptions = queryOptions({
  queryKey: ["uno", "os", "situacoes"],
  queryFn: () => listarSituacoesOS(),
  staleTime: 5 * 60_000,
});

const modelosChecklistQueryOptions = queryOptions({
  queryKey: ["uno", "checklist", "modelos"],
  queryFn: () => listarModelosChecklist(),
  staleTime: 5 * 60_000,
});

type OSDetalheSearch = { atend: number };

function validateOSDetalheSearch(input: Record<string, unknown>): OSDetalheSearch {
  const raw = input?.atend;
  const n = typeof raw === "number" ? raw : Number(raw);
  return { atend: Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0 };
}

export const Route = createFileRoute("/os/$codOs/")({
  validateSearch: validateOSDetalheSearch,
  head: ({ params }) => ({
    meta: [{ title: `OS ${params.codOs} — GranLave` }],
  }),
  loaderDeps: ({ search }: { search: OSDetalheSearch }) => ({ atend: search.atend }),
  loader: ({
    params,
    deps,
    context,
  }: {
    params: { codOs: string };
    deps: { atend: number };
    context: { queryClient: import("@tanstack/react-query").QueryClient };
  }) => {
    if (!deps.atend) return;
    context.queryClient.ensureQueryData(
      osDetalheQueryOptions(params.codOs, deps.atend),
    );
    context.queryClient.ensureQueryData(situacoesQueryOptions);
    context.queryClient.ensureQueryData(modelosChecklistQueryOptions);
    return;
  },
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
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
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

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Raw UNO (debug)
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-3 text-[11px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>

        <SituacoesSection codOs={codOs} atend={atend} codStatusAtual={data.codStatus} />

        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link to="/">Voltar ao painel</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function SituacoesSection({
  codOs,
  atend,
  codStatusAtual,
}: {
  codOs: string;
  atend: number;
  codStatusAtual?: number;
}) {
  const { data: situacoes } = useSuspenseQuery(situacoesQueryOptions);
  // Pré-carrega os modelos para a 3ª tela
  useSuspenseQuery(modelosChecklistQueryOptions);

  const etapas = buildEtapas(situacoes, codStatusAtual);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Etapas da OS</h2>
      {etapas.map((e) => (
        <EtapaCard key={e.situacao.codigo} etapa={e} codOs={codOs} atend={atend} />
      ))}
    </section>
  );
}

function EtapaCard({
  etapa,
  codOs,
  atend,
}: {
  etapa: EtapaTimeline;
  codOs: string;
  atend: number;
}) {
  const { situacao, estado } = etapa;
  const titulo =
    situacao.descAbrev ?? situacao.descricaoAbreviada ?? situacao.descricao;

  const styles =
    estado === "atual"
      ? "border-primary/60 ring-1 ring-primary/30"
      : estado === "concluido"
        ? "border-emerald-500/40 bg-emerald-500/5"
        : "opacity-60";

  const icon =
    estado === "concluido" ? (
      <Check className="h-5 w-5 text-emerald-600" />
    ) : estado === "atual" ? (
      <CircleDot className="h-5 w-5 text-primary" />
    ) : (
      <Circle className="h-5 w-5 text-muted-foreground" />
    );

  const label =
    estado === "concluido"
      ? "Concluído"
      : estado === "atual"
        ? "Em andamento"
        : "Pendente";

  const content = (
    <Card className={`flex items-center gap-3 p-4 ${styles}`}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Etapa #{situacao.codigo}
        </div>
        <div className="truncate text-sm font-medium text-foreground">{titulo}</div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {label}
        {estado === "pendente" && <Lock className="h-3.5 w-3.5" />}
      </div>
    </Card>
  );

  if (estado === "pendente") {
    return <div aria-disabled>{content}</div>;
  }

  return (
    <Link
      to="/os/$codOs/etapa/$codSituacao"
      params={{ codOs, codSituacao: String(situacao.codigo) }}
      search={{ atend }}
      className="block transition hover:scale-[1.005]"
    >
      {content}
    </Link>
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