import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listarSituacoesOS } from "@/lib/uno/os-situacoes";
import {
  findModeloForSituacao,
  listarModelosChecklist,
} from "@/lib/uno/checklist-modelos";
import { ChecklistItens } from "@/components/os/ChecklistItens";

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

export const Route = createFileRoute("/os/$codOs/etapa/$codSituacao")({
  head: ({ params }) => ({
    meta: [
      { title: `OS ${params.codOs} — Etapa ${params.codSituacao} — GranLave` },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(situacoesQueryOptions);
    context.queryClient.ensureQueryData(modelosChecklistQueryOptions);
    return;
  },
  component: EtapaChecklistPage,
});

function EtapaChecklistPage() {
  const { codOs, codSituacao } = Route.useParams();
  const { atend } = Route.useSearch();
  const codigo = Number(codSituacao);

  const { data: situacoes } = useSuspenseQuery(situacoesQueryOptions);
  const { data: modelos } = useSuspenseQuery(modelosChecklistQueryOptions);

  const situacao = situacoes.find((s) => s.codigo === codigo);
  const modelo = situacao ? findModeloForSituacao(modelos, situacao) : undefined;
  const idModelo = (modelo?.id ?? modelo?.codigo) as number | undefined;

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
          <h2 className="mb-3 text-sm font-semibold text-foreground">Checklist</h2>
          {idModelo ? (
            <ChecklistItens idModeloChecklist={idModelo} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum modelo de checklist vinculado a esta etapa.
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