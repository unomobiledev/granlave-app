import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Circle, CircleDot, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { osDetalheQueryOptions } from "./os.$codOs";
import { listarSituacoesOS } from "@/lib/uno/os-situacoes";
import { listarModelosChecklist } from "@/lib/uno/checklist-modelos";
import { buildEtapas, type EtapaTimeline } from "@/lib/uno/os-etapas";

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

export const Route = createFileRoute("/os/$codOs/")({
  head: ({ params }) => ({
    meta: [{ title: `OS ${params.codOs} — GranLave` }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(situacoesQueryOptions);
    context.queryClient.ensureQueryData(modelosChecklistQueryOptions);
    return;
  },
  component: OSDetalhePage,
});

function OSDetalhePage() {
  const { codOs } = Route.useParams();
  const { atend } = Route.useSearch() as { atend: number };

  if (!atend) {
    return null;
  }

  const { data } = useSuspenseQuery(osDetalheQueryOptions(codOs, atend));

  return (
    <>
      <SituacoesSection codOs={codOs} atend={atend} codStatusAtual={data.codStatus} />
      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link to="/">Voltar ao painel</Link>
        </Button>
      </div>
    </>
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {etapas.map((e) => (
          <EtapaCard key={e.situacao.codigo} etapa={e} codOs={codOs} atend={atend} />
        ))}
      </div>
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
    <Card className={`flex h-full flex-col gap-3 p-4 ${styles}`}>
      <div className="flex items-center justify-between">
        <div className="shrink-0">{icon}</div>
        {estado === "pendente" && (
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Etapa #{situacao.codigo}
        </div>
        <div className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
          {titulo}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
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
      className="block h-full transition hover:scale-[1.01]"
    >
      {content}
    </Link>
  );
}
