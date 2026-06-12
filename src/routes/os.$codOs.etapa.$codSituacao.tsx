import { useState } from "react";
import {
  createFileRoute,
  Link,
  Navigate,
  useNavigate,
} from "@tanstack/react-router";
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, FlagOff, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listarSituacoesOS } from "@/lib/uno/os-situacoes";
import { getChecklistIdForStatus } from "@/lib/uno/status-checklist-map";
import { formatSituacaoLabel } from "@/lib/uno/os-situacao-label";
import { ChecklistItens } from "@/components/os/ChecklistItens";
import { osDetalheQueryOptions } from "./os.$codOs";
import { useTrucksStore } from "@/store/trucks";
import {
  avancarStatusOS,
  COD_STATUS_CONCLUIDA,
} from "@/lib/uno/os-status";
import { FinalizarAntecipadoDialog } from "@/components/stage2/FinalizarAntecipadoDialog";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checklistComplete, setChecklistComplete] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);

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

  // Próxima situação cadastrada (ordenada por código).
  const proxima = [...situacoes]
    .filter((s) => s.codigo > codigo)
    .sort((a, b) => a.codigo - b.codigo)[0];

  const proximaLabel = proxima ? formatSituacaoLabel(proxima) : undefined;

  const invalidateOs = () => {
    queryClient.invalidateQueries({
      queryKey: ["uno", "os", "detalhe", codOs, Number(atend)],
    });
    queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) &&
        q.queryKey[0] === "uno" &&
        q.queryKey[1] === "os" &&
        q.queryKey[2] === "status",
    });
  };

  const advanceMutation = useMutation({
    mutationFn: (novoCodStatus: number) =>
      avancarStatusOS({
        codOs,
        codAtendimento: Number(atend),
        novoCodStatus,
      }),
    onSuccess: (_data, novoCodStatus) => {
      invalidateOs();
      if (novoCodStatus === COD_STATUS_CONCLUIDA) {
        toast.success("Serviço finalizado");
      } else {
        toast.success(
          `Etapa liberada${proximaLabel ? ` para ${proximaLabel}` : ""}`,
        );
      }
      navigate({ to: "/os/$codOs", params: { codOs }, search: { atend } });
    },
    onError: (err) => {
      toast.error("Falha ao avançar status", {
        description: (err as Error).message,
      });
    },
  });

  const pending = advanceMutation.isPending;
  const canFinalizarAntecipado =
    situacao != null &&
    situacao.codStatus !== COD_STATUS_CONCLUIDA &&
    situacao.codStatus >= 2 &&
    situacao.codStatus <= 5;

  return (
    <>
      <Card className="p-6">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          OS {codOs} — Etapa #{codigo}
        </div>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          {situacao ? formatSituacaoLabel(situacao) : `Etapa ${codigo}`}
        </h1>
      </Card>

      <Card className="p-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {isFila ? "Etapa" : "Checklist"}
        </h2>
        {isFila ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              O veículo está aguardando na fila. Libere para iniciar a próxima
              etapa.
            </p>
            <Button
              type="button"
              size="lg"
              className="w-full gap-2 sm:w-auto"
              disabled={pending || !proxima}
              onClick={() =>
                proxima && advanceMutation.mutate(proxima.codStatus)
              }
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {proximaLabel
                ? `Liberar para ${proximaLabel}`
                : "Liberar próxima etapa"}
            </Button>
          </div>
        ) : idModelo ? (
          <ChecklistItens
            idModeloChecklist={idModelo}
            codOs={codOs}
            codAtendimento={Number(atend)}
            codSituacao={codigo}
            nomeChecklist={
              situacao ? formatSituacaoLabel(situacao) : `Checklist ${idModelo}`
            }
            onProgressChange={(done, total, saved) =>
              setChecklistComplete(total > 0 && done === total && saved)
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

        {!isFila && idModelo && proxima && (
          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-neutral-200 pt-4 sm:flex-row sm:justify-end">
            {canFinalizarAntecipado && (
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                disabled={pending}
                onClick={() => setFinalizeOpen(true)}
              >
                <FlagOff className="h-4 w-4" />
                Finalizar serviço
              </Button>
            )}
            <Button
              type="button"
              className="gap-2"
              disabled={!checklistComplete || pending}
              title={
                !checklistComplete
                  ? "Preencha e salve o checklist para avançar"
                  : undefined
              }
              onClick={() => advanceMutation.mutate(proxima.codStatus)}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {proximaLabel
                ? `Avançar para ${proximaLabel}`
                : "Avançar etapa"}
            </Button>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link to="/os/$codOs" params={{ codOs }} search={{ atend }}>
            Voltar para a OS
          </Link>
        </Button>
      </div>

      <FinalizarAntecipadoDialog
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        onConfirm={() => {
          // TODO: enviar motivo/justificativa ao UNO quando o endpoint suportar.
          setFinalizeOpen(false);
          advanceMutation.mutate(COD_STATUS_CONCLUIDA);
        }}
      />
    </>
  );
}