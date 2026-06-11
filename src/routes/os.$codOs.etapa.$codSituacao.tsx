import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listarSituacoesOS } from "@/lib/uno/os-situacoes";
import { getChecklistIdForStatus } from "@/lib/uno/status-checklist-map";
import { ChecklistItens } from "@/components/os/ChecklistItens";
import { osDetalheQueryOptions } from "./os.$codOs";
import { useTrucksStore } from "@/store/trucks";

const situacoesQueryOptions = queryOptions({
  queryKey: ["uno", "os", "situacoes"],
  queryFn: () => listarSituacoesOS(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/os/$codOs/etapa/$codSituacao")({
  head: ({ params }) => ({
    meta: [
      { title: `OS ${params.codOs} — Etapa ${params.codSituacao} — GranLave` },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(situacoesQueryOptions);
    return;
  },
  component: EtapaChecklistPage,
});

function EtapaChecklistPage() {
  const { codOs, codSituacao } = Route.useParams();
  const { atend } = Route.useSearch();
  const codigo = Number(codSituacao);

  const { data: situacoes } = useSuspenseQuery(situacoesQueryOptions);
  const { data: osDetalhe } = useSuspenseQuery(
    osDetalheQueryOptions(codOs, Number(atend)),
  );
  const getOrAdoptTruckForOS = useTrucksStore((s) => s.getOrAdoptTruckForOS);

  const situacao = situacoes.find((s) => s.codigo === codigo);
  const idModelo = situacao
    ? getChecklistIdForStatus(situacao.codStatus)
    : undefined;

  // Etapa Recepção (status 1) abre o Stage1Wizard hidratado com a OS já criada.
  if (situacao?.codStatus === 1) {
    const truckId = getOrAdoptTruckForOS(osDetalhe);
    return (
      <Navigate
        to="/etapa/$stageId/$truckId"
        params={{ stageId: "1", truckId }}
      />
    );
  }

  const isFila = situacao?.codStatus === 2;

  return (
    <>
      <Card className="p-6">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          OS {codOs} — Etapa #{codigo}
        </div>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          {situacao
            ? (situacao.descricao ??
              situacao.descAbrev ??
              situacao.descricaoAbreviada ??
              `Etapa ${codigo}`)
            : `Etapa ${codigo}`}
        </h1>
      </Card>

      <Card className="p-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {isFila ? "Etapa" : "Checklist"}
        </h2>
        {isFila ? (
          <p className="text-xs text-muted-foreground">Sem ações nesta etapa.</p>
        ) : idModelo ? (
          <ChecklistItens
            idModeloChecklist={idModelo}
            codOs={codOs}
            codAtendimento={Number(atend)}
            codSituacao={codigo}
            nomeChecklist={
              situacao?.descricao ??
              situacao?.descAbrev ??
              situacao?.descricaoAbreviada ??
              `Checklist ${idModelo}`
            }
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
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link to="/os/$codOs" params={{ codOs }} search={{ atend }}>
            Voltar para a OS
          </Link>
        </Button>
      </div>
    </>
  );
}