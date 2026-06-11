import { useMemo, useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import {
  listarItensModeloChecklist,
  type ChecklistItemModelo,
} from "@/lib/uno/checklist-modelos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const grupos = agruparItens(data);

  return (
    <div className="space-y-5">
      {grupos.map(({ grupo, itens }) => (
        <section key={grupo} className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {grupo}
          </h3>
          <ul className="space-y-2">
            {itens.map((item) => (
              <ChecklistItem
                key={item.idModeloChecklistPergunta}
                item={item}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function agruparItens(itens: ChecklistItemModelo[]) {
  const map = new Map<string, ChecklistItemModelo[]>();
  for (const it of itens) {
    const g = it.grupoPergunta?.trim() || "Geral";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(it);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }
  return Array.from(map.entries()).map(([grupo, itens]) => ({ grupo, itens }));
}

function ChecklistItem({ item }: { item: ChecklistItemModelo }) {
  return (
    <li className="rounded-md border border-neutral-200 bg-background p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="text-sm text-foreground">{item.pergunta}</div>
          {item.descricao ? (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {item.descricao}
            </div>
          ) : null}
        </div>
        <div className="shrink-0">
          <RespostaInput item={item} />
        </div>
      </div>
    </li>
  );
}

function RespostaInput({ item }: { item: ChecklistItemModelo }) {
  if (item.tipoResposta === 1) {
    return <BoolOKNOK />;
  }
  if (item.tipoResposta === 3) {
    return <ComboInput comboFixo={item.comboFixo ?? ""} />;
  }
  // tipoResposta === 2 (livre)
  return <LivreInput pergunta={item.pergunta} />;
}

/* ----- Tipo 1: OK/NOK booleano, com campo de não conformidade ----- */
function BoolOKNOK() {
  const [resposta, setResposta] = useState<"OK" | "NOK" | null>(null);
  const [observacao, setObservacao] = useState("");
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <OKButton active={resposta === "OK"} onClick={() => setResposta("OK")} />
        <NOKButton active={resposta === "NOK"} onClick={() => setResposta("NOK")} />
      </div>
      {resposta === "NOK" && (
        <Textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Descreva a não conformidade…"
          className="min-h-[64px] w-full text-sm sm:w-72"
        />
      )}
    </div>
  );
}

/* ----- Tipo 3: combo a partir de comboFixo (Sim|Não|N/A, Aprovado|Reprovado|N/A, …) ----- */
function ComboInput({ comboFixo }: { comboFixo: string }) {
  const opcoes = useMemo(
    () =>
      comboFixo
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
    [comboFixo],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");

  const isSimNao =
    opcoes.length > 0 &&
    opcoes.every((o) => ["Sim", "Não", "N/A"].includes(o));

  const showNC = isSimNao && selected === "Não";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {opcoes.map((opc) => {
          const active = selected === opc;
          let cls = "h-8 px-3";
          if (isSimNao) {
            if (opc === "Sim" && active) cls += " bg-emerald-600 hover:bg-emerald-600/90";
            if (opc === "Não" && active) cls += " bg-destructive hover:bg-destructive/90";
          }
          return (
            <Button
              key={opc}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className={cn(cls)}
              onClick={() => setSelected(opc)}
            >
              {isSimNao && opc === "Sim" ? (
                <Check className="mr-1 h-3.5 w-3.5" />
              ) : isSimNao && opc === "Não" ? (
                <X className="mr-1 h-3.5 w-3.5" />
              ) : null}
              {opc}
            </Button>
          );
        })}
      </div>
      {showNC && (
        <Textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Descreva a não conformidade…"
          className="min-h-[64px] w-full text-sm sm:w-72"
        />
      )}
    </div>
  );
}

/* ----- Tipo 2: campo livre (texto / numérico por heurística) ----- */
const NUMERICO_PREFIXOS = [
  "Temperatura",
  "Tempo",
  "Número do lacre",
  "Resultado do",
  "Quantidade",
];
function LivreInput({ pergunta }: { pergunta: string }) {
  const [valor, setValor] = useState("");
  const isNumerico = NUMERICO_PREFIXOS.some((p) => pergunta.startsWith(p));
  return (
    <Input
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      inputMode={isNumerico ? "decimal" : "text"}
      placeholder={isNumerico ? "Valor" : "Resposta"}
      className="w-full sm:w-72"
    />
  );
}

function OKButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      className={cn("h-8 gap-1 px-3", active && "bg-emerald-600 hover:bg-emerald-600/90")}
      onClick={onClick}
    >
      <Check className="h-3.5 w-3.5" /> OK
    </Button>
  );
}
function NOKButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      className={cn("h-8 gap-1 px-3", active && "bg-destructive hover:bg-destructive/90")}
      onClick={onClick}
    >
      <X className="h-3.5 w-3.5" /> NOK
    </Button>
  );
}