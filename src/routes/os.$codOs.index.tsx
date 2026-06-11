import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Circle, CircleDot, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { osDetalheQueryOptions } from "./os.$codOs";
import { listarSituacoesOS } from "@/lib/uno/os-situacoes";
import { getChecklistIdForStatus } from "@/lib/uno/status-checklist-map";
import { buildEtapas, type EtapaTimeline } from "@/lib/uno/os-etapas";
import { ChecklistItens } from "@/components/os/ChecklistItens";
import { useTrucksStore } from "@/store/trucks";
import type { OSDetalhe } from "@/lib/uno/os-detalhe";
import { cn } from "@/lib/utils";

const situacoesQueryOptions = queryOptions({
  queryKey: ["uno", "os", "situacoes"],
  queryFn: () => listarSituacoesOS(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/os/$codOs/")({
  head: ({ params }) => ({
    meta: [{ title: `OS ${params.codOs} — GranLave` }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(situacoesQueryOptions);
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
      <SituacoesSection
        codOs={codOs}
        atend={atend}
        codStatusAtual={data.codStatus}
        osDetalhe={data}
      />
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
  osDetalhe,
}: {
  codOs: string;
  atend: number;
  codStatusAtual?: number;
  osDetalhe: OSDetalhe;
}) {
  const { data: situacoes } = useSuspenseQuery(situacoesQueryOptions);

  const etapas = buildEtapas(situacoes, codStatusAtual);
  const [aberta, setAberta] = useState<number | null>(null);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Etapas da OS</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {etapas.map((e) => (
          <EtapaCard
            key={e.situacao.codigo}
            etapa={e}
            codOs={codOs}
            atend={atend}
            osDetalhe={osDetalhe}
            aberta={aberta === e.situacao.codigo}
            onToggle={() =>
              setAberta((prev) =>
                prev === e.situacao.codigo ? null : e.situacao.codigo,
              )
            }
          />
        ))}
      </div>
    </section>
  );
}

function EtapaCard({
  etapa,
  codOs,
  atend,
  osDetalhe,
  aberta,
  onToggle,
}: {
  etapa: EtapaTimeline;
  codOs: string;
  atend: number;
  osDetalhe: OSDetalhe;
  aberta: boolean;
  onToggle: () => void;
}) {
  const { situacao, estado } = etapa;
  const navigate = useNavigate();
  const getOrAdoptTruckForOS = useTrucksStore((s) => s.getOrAdoptTruckForOS);
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

  const idModelo = getChecklistIdForStatus(situacao.codStatus);
  const disabled = estado === "pendente";
  const isRecepcao = situacao.codStatus === 1;
  const isFila = situacao.codStatus === 2;

  const abrirRecepcao = () => {
    const truckId = getOrAdoptTruckForOS(osDetalhe);
    navigate({
      to: "/etapa/$stageId/$truckId",
      params: { stageId: "1", truckId },
    });
  };

  return (
    <Card
      className={cn(
        "flex h-full flex-col gap-3 p-4 transition",
        styles,
        aberta && !isRecepcao && "sm:col-span-2 lg:col-span-3",
      )}
    >
      <button
        type="button"
        onClick={disabled ? undefined : isRecepcao ? abrirRecepcao : onToggle}
        disabled={disabled}
        aria-expanded={isRecepcao ? undefined : aberta}
        className={cn(
          "flex w-full flex-col gap-3 text-left",
          !disabled && "cursor-pointer",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="shrink-0">{icon}</div>
          {disabled ? (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          ) : isRecepcao ? null : (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                aberta && "rotate-180",
              )}
            />
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
      </button>

      {aberta && !isRecepcao && (
        <div className="border-t border-neutral-200 pt-4">
          {isFila ? (
            <p className="text-xs text-muted-foreground">
              Sem ações nesta etapa.
            </p>
          ) : idModelo ? (
            <ChecklistItens
              idModeloChecklist={idModelo}
              codOs={codOs}
              codAtendimento={atend}
              codSituacao={situacao.codigo}
              nomeChecklist={titulo ?? `Checklist ${idModelo}`}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum modelo de checklist configurado para esta etapa. Configure em{" "}
              <Link to="/configuracoes/checklist" className="underline">
                Configurações › Checklist
              </Link>
              .
            </p>
          )}
          {!isFila && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/os/$codOs/etapa/$codSituacao"
                  params={{ codOs, codSituacao: String(situacao.codigo) }}
                  search={{ atend }}
                >
                  Abrir em tela cheia
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
