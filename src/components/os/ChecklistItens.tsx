import { useEffect, useMemo, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  listarItensModeloChecklist,
  type ChecklistItemModelo,
} from "@/lib/uno/checklist-modelos";
import {
  listarChecklistsDaOS,
  criarChecklist,
  atualizarRespostaChecklist,
  getCodColaboradorFromToken,
  type ChecklistGravado,
  type ChecklistCreatePayload,
} from "@/lib/uno/checklist-respostas";
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

const checklistDaOSQueryOptions = (
  codOs: string | number,
  codAtendimento: number,
) =>
  queryOptions({
    queryKey: ["uno", "checklist", "os", String(codOs), codAtendimento],
    queryFn: () => listarChecklistsDaOS(codOs, codAtendimento),
    staleTime: 30_000,
  });

type RespostaState = {
  resposta: string;
  observacao: string;
  idChecklistResposta?: number;
  dirty: boolean;
};

type EstadoMap = Record<number, RespostaState>;

function hydrateEstado(
  itens: ChecklistItemModelo[],
  gravado: ChecklistGravado | undefined,
): EstadoMap {
  const out: EstadoMap = {};
  for (const it of itens) {
    const r = gravado?.respostas.find(
      (x) => x.idModeloChecklistPergunta === it.idModeloChecklistPergunta,
    );
    out[it.idModeloChecklistPergunta] = {
      resposta: r?.resposta ?? "",
      observacao: r?.observacao ?? "",
      idChecklistResposta: r?.idChecklistResposta,
      dirty: false,
    };
  }
  return out;
}

function isRespostaCompleta(
  item: ChecklistItemModelo,
  state: RespostaState | undefined,
): boolean {
  if (!state) return false;
  const resp = (state.resposta ?? "").trim();
  const obs = (state.observacao ?? "").trim();
  if (item.tipoResposta === 1) {
    if (resp !== "OK" && resp !== "NOK") return false;
    if (resp === "NOK" && !obs) return false;
    return true;
  }
  if (item.tipoResposta === 3) {
    const opcoes = (item.comboFixo ?? "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!opcoes.includes(resp)) return false;
    const isSimNao =
      opcoes.length > 0 && opcoes.every((o) => ["Sim", "Não", "N/A"].includes(o));
    if (isSimNao && resp === "Não" && !obs) return false;
    return true;
  }
  return resp.length > 0;
}

export function ChecklistItens({
  idModeloChecklist,
  codOs,
  codAtendimento,
  codSituacao,
  nomeChecklist,
  onProgressChange,
}: {
  idModeloChecklist: number;
  codOs: string | number;
  codAtendimento: number;
  codSituacao: number;
  nomeChecklist: string;
  onProgressChange?: (done: number, total: number, saved: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const itensQ = useQuery(itensChecklistQueryOptions(idModeloChecklist));
  const checklistsQ = useQuery(
    checklistDaOSQueryOptions(codOs, codAtendimento),
  );

  const gravado = useMemo(
    () =>
      checklistsQ.data?.find((c) => c.idModeloChecklist === idModeloChecklist),
    [checklistsQ.data, idModeloChecklist],
  );

  const [estado, setEstado] = useState<EstadoMap>({});
  const [attemptedSave, setAttemptedSave] = useState(false);

  // Rehidrata sempre que itens ou checklist gravado mudarem
  useEffect(() => {
    if (itensQ.data) setEstado(hydrateEstado(itensQ.data, gravado));
  }, [itensQ.data, gravado]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!itensQ.data) return;
      if (!gravado) {
        // POST cadastro/checklist com payload completo
        const codColaborador = getCodColaboradorFromToken();
        const now = new Date().toISOString();
        const payload: ChecklistCreatePayload = {
          idModeloChecklist,
          nomeChecklist,
          situacao: codSituacao,
          dtInicio: now,
          dtFim: null,
          observacao: "",
          origem: 1,
          codOportunidade: 0,
          codOs: Number(codOs),
          codAtendimento,
          codOcorrencia: 0,
          resultado: 0,
          respostas: itensQ.data.map((it) => {
            const s = estado[it.idModeloChecklistPergunta] ?? {
              resposta: "",
              observacao: "",
              dirty: false,
            };
            return {
              idModeloChecklistPergunta: it.idModeloChecklistPergunta,
              pergunta: it.pergunta,
              resposta: s.resposta,
              observacao: s.observacao || undefined,
              dtResposta: now,
              codColaborador,
            };
          }),
        };
        await criarChecklist(payload);
      } else {
        // PUT por resposta dirty (com idChecklistResposta)
        const tasks: Array<Promise<unknown>> = [];
        for (const it of itensQ.data) {
          const s = estado[it.idModeloChecklistPergunta];
          if (!s || !s.dirty || !s.idChecklistResposta) continue;
          tasks.push(
            atualizarRespostaChecklist(
              codOs,
              codAtendimento,
              s.idChecklistResposta,
              {
                resposta: s.resposta,
                observacao: s.observacao || undefined,
              },
            ),
          );
        }
        if (tasks.length === 0) return;
        await Promise.all(tasks);
      }
    },
    onSuccess: () => {
      toast.success("Checklist salvo");
      queryClient.invalidateQueries({
        queryKey: ["uno", "checklist", "os", String(codOs), codAtendimento],
      });
    },
    onError: (err) => {
      toast.error("Falha ao salvar checklist", {
        description: (err as Error).message,
      });
    },
  });

  if (itensQ.isLoading || checklistsQ.isLoading) {
    return <p className="text-xs text-muted-foreground">Carregando checklist…</p>;
  }
  if (itensQ.error) {
    return (
      <p className="text-xs text-destructive">
        Erro ao carregar checklist: {(itensQ.error as Error).message}
      </p>
    );
  }
  if (!itensQ.data || itensQ.data.length === 0) {
    return <p className="text-xs text-muted-foreground">Sem itens neste modelo.</p>;
  }

  const grupos = agruparItens(itensQ.data);
  const algumDirty = Object.values(estado).some((s) => s.dirty);
  const faltantes = itensQ.data.filter(
    (it) => !isRespostaCompleta(it, estado[it.idModeloChecklistPergunta]),
  );
  const completo = faltantes.length === 0;
  const podeSalvar = completo && (!gravado || algumDirty);

  const total = itensQ.data.length;
  const done = total - faltantes.length;
  useEffect(() => {
    onProgressChange?.(done, total, Boolean(gravado) && !algumDirty);
  }, [done, total, gravado, algumDirty, onProgressChange]);

  const updateItem = (id: number, patch: Partial<RespostaState>) => {
    setEstado((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch, dirty: true },
    }));
  };

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
                state={
                  estado[item.idModeloChecklistPergunta] ?? {
                    resposta: "",
                    observacao: "",
                    dirty: false,
                  }
                }
                missing={
                  attemptedSave &&
                  !isRespostaCompleta(
                    item,
                    estado[item.idModeloChecklistPergunta],
                  )
                }
                onChange={(patch) =>
                  updateItem(item.idModeloChecklistPergunta, patch)
                }
              />
            ))}
          </ul>
        </section>
      ))}

      <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
        <div
          className={cn(
            "text-xs",
            !completo ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {!completo
            ? `Faltam ${faltantes.length} ${faltantes.length === 1 ? "resposta" : "respostas"}`
            : gravado
              ? algumDirty
                ? "Alterações não salvas"
                : "Checklist salvo"
              : "Checklist ainda não gravado"}
        </div>
        <div className="flex gap-2">
          {algumDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() =>
                itensQ.data && setEstado(hydrateEstado(itensQ.data, gravado))
              }
            >
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={!podeSalvar || saveMutation.isPending}
            title={!completo ? "Responda todos os itens para salvar" : undefined}
            onClick={() => {
              if (!completo) {
                setAttemptedSave(true);
                toast.error("Responda todos os itens obrigatórios");
                return;
              }
              saveMutation.mutate();
            }}
          >
            {saveMutation.isPending && (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            Salvar
          </Button>
        </div>
      </div>
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

function ChecklistItem({
  item,
  state,
  missing,
  onChange,
}: {
  item: ChecklistItemModelo;
  state: RespostaState;
  missing?: boolean;
  onChange: (patch: Partial<RespostaState>) => void;
}) {
  return (
    <li
      className={cn(
        "rounded-md border bg-background p-3",
        missing ? "border-destructive/50" : "border-neutral-200",
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="text-sm text-foreground">
            {item.pergunta}
            <span className="ml-0.5 text-destructive">*</span>
          </div>
          {item.descricao ? (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {item.descricao}
            </div>
          ) : null}
        </div>
        <div className="shrink-0">
          <RespostaInput item={item} state={state} onChange={onChange} />
        </div>
      </div>
    </li>
  );
}

function RespostaInput({
  item,
  state,
  onChange,
}: {
  item: ChecklistItemModelo;
  state: RespostaState;
  onChange: (patch: Partial<RespostaState>) => void;
}) {
  if (item.tipoResposta === 1) {
    return <BoolOKNOK state={state} onChange={onChange} />;
  }
  if (item.tipoResposta === 3) {
    return (
      <ComboInput
        comboFixo={item.comboFixo ?? ""}
        state={state}
        onChange={onChange}
      />
    );
  }
  // tipoResposta === 2 (livre)
  return <LivreInput pergunta={item.pergunta} state={state} onChange={onChange} />;
}

/* ----- Tipo 1: OK/NOK booleano, com campo de não conformidade ----- */
function BoolOKNOK({
  state,
  onChange,
}: {
  state: RespostaState;
  onChange: (patch: Partial<RespostaState>) => void;
}) {
  const resposta = state.resposta === "OK" || state.resposta === "NOK" ? state.resposta : null;
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <OKButton active={resposta === "OK"} onClick={() => onChange({ resposta: "OK", observacao: "" })} />
        <NOKButton active={resposta === "NOK"} onClick={() => onChange({ resposta: "NOK" })} />
      </div>
      {resposta === "NOK" && (
        <Textarea
          value={state.observacao}
          onChange={(e) => onChange({ observacao: e.target.value })}
          placeholder="Descreva a não conformidade…"
          className="min-h-[64px] w-full text-sm sm:w-72"
        />
      )}
    </div>
  );
}

/* ----- Tipo 3: combo a partir de comboFixo (Sim|Não|N/A, Aprovado|Reprovado|N/A, …) ----- */
function ComboInput({
  comboFixo,
  state,
  onChange,
}: {
  comboFixo: string;
  state: RespostaState;
  onChange: (patch: Partial<RespostaState>) => void;
}) {
  const opcoes = useMemo(
    () =>
      comboFixo
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
    [comboFixo],
  );
  const selected = state.resposta || null;

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
              onClick={() =>
                onChange({
                  resposta: opc,
                  observacao: opc === "Não" ? state.observacao : "",
                })
              }
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
          value={state.observacao}
          onChange={(e) => onChange({ observacao: e.target.value })}
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
function LivreInput({
  pergunta,
  state,
  onChange,
}: {
  pergunta: string;
  state: RespostaState;
  onChange: (patch: Partial<RespostaState>) => void;
}) {
  const isNumerico = NUMERICO_PREFIXOS.some((p) => pergunta.startsWith(p));
  return (
    <Input
      value={state.resposta}
      onChange={(e) => onChange({ resposta: e.target.value })}
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