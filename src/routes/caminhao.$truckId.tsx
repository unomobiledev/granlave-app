import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  Truck as TruckIcon,
} from "lucide-react";
import { STAGES } from "@/data/stages";
import {
  useTrucksStore,
  checklistProgress,
  isChecklistComplete,
  type Truck,
} from "@/store/trucks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AppHeader } from "@/components/AppHeader";
import { listarStatusOSCadastrados } from "@/lib/uno/status-os-cadastrados";
import { buildEtapas, type EtapaTimeline } from "@/lib/uno/os-etapas";
import type { OSSituacao } from "@/lib/uno/os-situacoes";
import { formatSituacaoLabel } from "@/lib/uno/os-situacao-label";
import { osDetalheQueryOptions } from "./os.$codOs";

const statusOSQueryOptions = queryOptions({
  queryKey: ["uno", "status-os", "cdw0050"],
  queryFn: () => listarStatusOSCadastrados(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/caminhao/$truckId")({
  head: () => ({ meta: [{ title: "Etapas do caminhão — GranLave" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(statusOSQueryOptions);
    return;
  },
  component: CaminhaoPage,
});

function CaminhaoPage() {
  const { truckId } = Route.useParams();
  const truck = useTrucksStore((s) => s.trucks.find((t) => t.id === truckId));

  if (!truck) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Caminhão não encontrado.</p>
        <Link to="/">
          <Button variant="outline">Voltar ao painel</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/30">
      <AppHeader />

      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white/70 px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">OS</div>
            <div className="font-mono font-semibold text-primary">
              {truck.os ?? <span className="text-muted-foreground">pendente</span>}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cliente</div>
            <div className="font-medium text-foreground">{truck.cliente}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Placa</div>
            <div className="font-mono font-semibold text-foreground">{truck.placa}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Motorista</div>
            <div className="font-medium text-foreground">{truck.motorista || "—"}</div>
          </div>
        </div>
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Painel
          </Button>
        </Link>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TruckIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Etapas do processo</h2>
            <p className="text-xs text-muted-foreground">
              Selecione uma etapa para visualizar o checklist
            </p>
          </div>
        </div>

        <EtapasGrid truck={truck} />
      </main>
    </div>
  );
}

function EtapasGrid({ truck }: { truck: Truck }) {
  const { data: situacoes } = useSuspenseQuery(statusOSQueryOptions);

  const temOSNoErp =
    !!truck.codOsErp && !!truck.codAtendimentoErp && !!truck.os;

  return temOSNoErp ? (
    <EtapasGridFromOS truck={truck} situacoes={situacoes} />
  ) : (
    <EtapasGridLocal
      truck={truck}
      etapas={buildEtapas(situacoes, 1)}
    />
  );
}

function EtapasGridFromOS({
  truck,
  situacoes,
}: {
  truck: Truck;
  situacoes: OSSituacao[];
}) {
  const { data: os } = useSuspenseQuery(
    osDetalheQueryOptions(String(truck.codOsErp), Number(truck.codAtendimentoErp)),
  );
  const etapas = buildEtapas(situacoes, os.codStatus);
  return <EtapasGridLocal truck={truck} etapas={etapas} osCodOs={String(truck.codOsErp)} osAtend={Number(truck.codAtendimentoErp)} />;
}

function EtapasGridLocal({
  truck,
  etapas,
  osCodOs,
  osAtend,
}: {
  truck: Truck;
  etapas: EtapaTimeline[];
  osCodOs?: string;
  osAtend?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {etapas.map((e) => (
        <EtapaCard
          key={e.situacao.codigo}
          etapa={e}
          truck={truck}
          osCodOs={osCodOs}
          osAtend={osAtend}
        />
      ))}
    </div>
  );
}

function EtapaCard({
  etapa,
  truck,
  osCodOs,
  osAtend,
}: {
  etapa: EtapaTimeline;
  truck: Truck;
  osCodOs?: string;
  osAtend?: number;
}) {
  const { situacao, estado } = etapa;
  const status: "done" | "current" | "pending" =
    estado === "concluido" ? "done" : estado === "atual" ? "current" : "pending";

  // Progresso/checklist local só faz sentido para o fluxo draft (sem OS no ERP).
  const localStage = STAGES.find((s) => s.id === situacao.codigo);
  const hasLocalChecklist = !osCodOs && !!localStage;
  const progress = hasLocalChecklist
    ? checklistProgress(truck, situacao.codigo)
    : null;
  const pct =
    progress && progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
  const complete = hasLocalChecklist
    ? isChecklistComplete(truck, situacao.codigo)
    : estado === "concluido";

  const finalStatus: "done" | "current" | "pending" = hasLocalChecklist
    ? complete || truck.stageId > situacao.codigo
      ? "done"
      : truck.stageId === situacao.codigo
        ? "current"
        : "pending"
    : status;

  const styles = {
    done: "border-primary/40 bg-gradient-to-br from-primary/10 to-primary/20",
    current:
      "border-primary ring-2 ring-primary/30 bg-gradient-to-br from-primary/5 to-primary/15 shadow-md",
    pending:
      "border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100/60 opacity-90",
  }[finalStatus];

  const Icon =
    finalStatus === "done"
      ? CheckCircle2
      : finalStatus === "current"
        ? Loader2
        : Circle;

  const titulo =
    situacao.descricao ?? situacao.descAbrev ?? situacao.descricaoAbreviada ?? `Etapa ${situacao.codigo}`;

  const linkProps = osCodOs
    ? ({
        to: "/os/$codOs/etapa/$codSituacao",
        params: { codOs: osCodOs, codSituacao: String(situacao.codigo) },
        search: { atend: osAtend },
      } as const)
    : ({
        to: "/etapa/$stageId/$truckId",
        params: { stageId: String(situacao.codigo), truckId: truck.id },
      } as const);

  return (
    <Link {...linkProps} className="group block">
      <Card
        className={`relative h-full overflow-hidden p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg ${styles}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                finalStatus === "pending"
                  ? "bg-neutral-200 text-neutral-500"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${finalStatus === "current" ? "animate-spin" : ""}`}
              />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Etapa {situacao.codigo}
              </div>
              <div className="text-base font-semibold leading-tight text-foreground">
                {titulo}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>

        {situacao.descAbrev && situacao.descricao && situacao.descAbrev !== situacao.descricao ? (
          <p className="mt-3 text-xs text-muted-foreground">{situacao.descAbrev}</p>
        ) : null}

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {progress ? `Checklist ${progress.done}/${progress.total}` : "—"}
            </span>
            <StatusBadge status={finalStatus} />
          </div>
          {progress ? <Progress value={pct} className="h-1.5" /> : null}
        </div>
      </Card>
    </Link>
  );
}

function StatusBadge({ status }: { status: "done" | "current" | "pending" }) {
  if (status === "done")
    return (
      <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
        Concluída
      </span>
    );
  if (status === "current")
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
        Em andamento
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
      Pendente
    </span>
  );
}