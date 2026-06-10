import { useQuery, queryOptions } from "@tanstack/react-query";
import {
  listarItensModeloChecklist,
  type ChecklistItemModelo,
} from "@/lib/uno/checklist-modelos";

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
    <ul className="space-y-1.5 text-sm">
      {data.map((item: ChecklistItemModelo) => (
        <li key={item.id} className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60" />
          <span className="text-foreground">
            {item.pergunta ?? item.descricao ?? `Item #${item.id}`}
          </span>
          {item.obrigatorio && (
            <span className="ml-auto text-[10px] text-destructive">obrigatório</span>
          )}
        </li>
      ))}
    </ul>
  );
}