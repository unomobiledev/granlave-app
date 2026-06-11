import { useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import {
  listarItensModeloChecklist,
  type ChecklistItemModelo,
} from "@/lib/uno/checklist-modelos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const itensChecklistQueryOptions = (idModeloChecklist: number) =>
  queryOptions({
    queryKey: ["uno", "checklist", "itens", idModeloChecklist],
    queryFn: () => listarItensModeloChecklist(idModeloChecklist),
    staleTime: 5 * 60_000,
  });

export function ChecklistItens({
  idModeloChecklist,
}: {
  idModeloChecklist: number;
}) {
  const { data, isLoading, error } = useQuery(
    itensChecklistQueryOptions(idModeloChecklist),
  );

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Carregando checklist…</p>;
  }
  if (error) {
    return (
      <p className="text-xs text-destructive">
        Erro ao carregar checklist: {(error as Error).message}
      </p>
    );
  }
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground">Sem itens neste modelo.</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map((item) => (
        <ChecklistItem key={item.id} item={item} />
      ))}
    </ul>
  );
}

type Resposta = "OK" | "NOK" | null;

function ChecklistItem({ item }: { item: ChecklistItemModelo }) {
  const [resposta, setResposta] = useState<Resposta>(null);
  const [observacao, setObservacao] = useState("");

  const pergunta = item.pergunta ?? item.descricao ?? `Item #${item.id}`;

  return (
    <li className="rounded-md border border-neutral-200 bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 text-sm text-foreground">
          {pergunta}
          {item.obrigatorio && (
            <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-destructive">
              obrigatório
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            size="sm"
            variant={resposta === "OK" ? "default" : "outline"}
            className={cn(
              "h-8 gap-1 px-3",
              resposta === "OK" && "bg-emerald-600 hover:bg-emerald-600/90",
            )}
            onClick={() => setResposta("OK")}
          >
            <Check className="h-3.5 w-3.5" /> OK
          </Button>
          <Button
            type="button"
            size="sm"
            variant={resposta === "NOK" ? "default" : "outline"}
            className={cn(
              "h-8 gap-1 px-3",
              resposta === "NOK" && "bg-destructive hover:bg-destructive/90",
            )}
            onClick={() => setResposta("NOK")}
          >
            <X className="h-3.5 w-3.5" /> NOK
          </Button>
        </div>
      </div>

      {resposta === "NOK" && (
        <div className="mt-3">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
            Descreva a não conformidade
          </label>
          <Textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Detalhe o problema encontrado…"
            className="mt-1 min-h-[72px] text-sm"
          />
        </div>
      )}
    </li>
  );
}