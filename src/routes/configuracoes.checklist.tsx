import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listarSituacoesOS } from "@/lib/uno/os-situacoes";
import { listarModelosChecklist } from "@/lib/uno/checklist-modelos";
import { formatSituacaoLabel } from "@/lib/uno/os-situacao-label";
import {
  DEFAULT_STATUS_CHECKLIST_MAP,
  useStatusChecklistMap,
  type StatusChecklistMap,
} from "@/lib/uno/status-checklist-map";

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

const NENHUM = "__nenhum__";

export const Route = createFileRoute("/configuracoes/checklist")({
  head: () => ({
    meta: [{ title: "Configurações › Checklist — GranLave" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(situacoesQueryOptions);
    context.queryClient.ensureQueryData(modelosChecklistQueryOptions);
    return;
  },
  component: ConfigChecklistPage,
});

function ConfigChecklistPage() {
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
          <h1 className="text-lg font-semibold text-foreground">
            De-para Status da OS → Modelo de Checklist
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Defina qual modelo de checklist deve ser carregado em cada etapa
            (status) da Ordem de Serviço.
          </p>
          <div className="mt-6">
            <Editor />
          </div>
        </Card>
      </main>
    </div>
  );
}

function Editor() {
  const { data: situacoes } = useSuspenseQuery(situacoesQueryOptions);
  const { data: modelos } = useSuspenseQuery(modelosChecklistQueryOptions);
  const { map, setMap, reset } = useStatusChecklistMap();

  // Estado local editável — só persiste ao clicar "Salvar".
  const [draft, setDraft] = useState<StatusChecklistMap>(map);
  useEffect(() => setDraft(map), [map]);

  const linhas = [...situacoes].sort((a, b) => a.codStatus - b.codStatus);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Descrição</th>
              <th className="px-3 py-2 text-left">Modelo de checklist</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((s) => {
              const current = draft[s.codStatus];
              return (
                <tr key={s.codigo} className="border-t border-neutral-200">
                  <td className="px-3 py-2 font-mono text-xs">{s.codStatus}</td>
                  <td className="px-3 py-2">
                    {formatSituacaoLabel(s)}
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={current ? String(current) : NENHUM}
                      onValueChange={(v) => {
                        setDraft((prev) => {
                          const next = { ...prev };
                          if (v === NENHUM) delete next[s.codStatus];
                          else next[s.codStatus] = Number(v);
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-full max-w-xs">
                        <SelectValue placeholder="— nenhum —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NENHUM}>— nenhum —</SelectItem>
                        {modelos.map((m) => {
                          const id = (m.id ?? m.codigo) as number | undefined;
                          if (!id) return null;
                          return (
                            <SelectItem key={id} value={String(id)}>
                              #{id} — {m.descricao ?? m.nome ?? `Modelo ${id}`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground">
          Padrão: {Object.entries(DEFAULT_STATUS_CHECKLIST_MAP)
            .map(([k, v]) => `Status ${k} → Checklist ${v}`)
            .join("  ·  ")}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => reset()}>
            Restaurar padrão
          </Button>
          <Button type="button" onClick={() => setMap(draft)}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}