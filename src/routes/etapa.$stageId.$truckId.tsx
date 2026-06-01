import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Truck as TruckIcon, CheckCircle2, FileText, FlagOff } from "lucide-react";
import { getStage, STAGES } from "@/data/stages";
import { useTrucksStore, isChecklistComplete, checklistProgress, type OkNok } from "@/store/trucks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AppHeader } from "@/components/AppHeader";
import { Textarea } from "@/components/ui/textarea";
import { Stage1Wizard } from "@/components/stage1/Stage1Wizard";
import { FinalizarAntecipadoDialog } from "@/components/stage2/FinalizarAntecipadoDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/etapa/$stageId/$truckId")({
  head: () => ({
    meta: [{ title: "Checklist de Etapa — GranLave" }],
  }),
  component: EtapaPage,
});

function EtapaPage() {
  const { stageId, truckId } = Route.useParams();
  const navigate = useNavigate();
  const stage = getStage(Number(stageId));
  const truck = useTrucksStore((s) => s.trucks.find((t) => t.id === truckId));
  const setChecklistItem = useTrucksStore((s) => s.setChecklistItem);
  const advanceStage = useTrucksStore((s) => s.advanceStage);
  const finalizarAntecipado = useTrucksStore((s) => s.finalizarAntecipado);
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  if (!stage || !truck) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Caminhão ou etapa não encontrados.</p>
        <Link to="/">
          <Button variant="outline">Voltar ao painel</Button>
        </Link>
      </div>
    );
  }

  const stageNum = Number(stageId);
  const state = truck.checklists[stageNum] ?? {};
  const complete = isChecklistComplete(truck, stageNum);
  const progress = checklistProgress(truck, stageNum);
  const pct = (progress.done / progress.total) * 100;
  const isLast = stageNum === STAGES.length;
  const isRecepcao = stageNum === 1;
  const canFinishEarly = stageNum === 2 && !isLast;

  const handleAdvance = () => {
    advanceStage(truck.id);
    if (isLast) {
      navigate({ to: "/" });
    } else {
      navigate({ to: "/caminhao/$truckId", params: { truckId: truck.id } });
    }
  };

  return (
    <div className="min-h-full bg-muted/30">
      <AppHeader />

      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white/70 px-6 py-3">
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
        <Link to="/caminhao/$truckId" params={{ truckId: truck.id }}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Etapas
          </Button>
        </Link>
      </div>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Etapa {stage.id} de {STAGES.length}
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-foreground">{stage.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{stage.description}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {isRecepcao ? <FileText className="h-7 w-7" /> : <TruckIcon className="h-7 w-7" />}
            </div>
          </div>
        </Card>

        {isRecepcao ? (
          <Stage1Wizard truck={truck} />
        ) : (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Checklist da etapa
            </h2>
            <span className="text-sm text-muted-foreground">
              {progress.done}/{progress.total} concluídos
            </span>
          </div>
          <Progress value={pct} className="mb-6 h-1.5" />

          <div className="space-y-3">
            {stage.checklist.map((item, idx) => {
              const value = state[item.id];
              const prevGroup = idx > 0 ? stage.checklist[idx - 1].group : undefined;
              const showGroup = item.group && item.group !== prevGroup;
              const groupHeader = showGroup ? (
                <div className="mt-4 first:mt-0 border-b pb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {item.group}
                </div>
              ) : null;
              if (item.type === "text") {
                return (
                  <div key={item.id}>
                    {groupHeader}
                    <div className="rounded-lg border bg-background p-4">
                    <Label htmlFor={item.id} className="text-sm font-medium">
                      {item.label}
                    </Label>
                    <Input
                      id={item.id}
                      className="mt-2"
                      placeholder={item.placeholder}
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) => setChecklistItem(truck.id, stageNum, item.id, e.target.value)}
                    />
                    </div>
                  </div>
                );
              }
              if (item.type === "select") {
                return (
                  <div key={item.id}>
                    {groupHeader}
                    <div className="rounded-lg border bg-background p-4">
                      <Label htmlFor={item.id} className="text-sm font-medium">
                        {item.label}
                      </Label>
                      <Select
                        value={typeof value === "string" ? value : ""}
                        onValueChange={(v) => setChecklistItem(truck.id, stageNum, item.id, v)}
                      >
                        <SelectTrigger id={item.id} className="mt-2">
                          <SelectValue placeholder="Selecione…" />
                        </SelectTrigger>
                        <SelectContent>
                          {(item.options ?? []).map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              }
              if (item.type === "oknok") {
                const ok = (typeof value === "object" && value !== null && "status" in value
                  ? (value as OkNok)
                  : undefined);
                const status = ok?.status;
                return (
                  <div key={item.id}>
                    {groupHeader}
                    <div
                      className={`rounded-lg border p-4 transition-colors ${
                        status === "ok"
                          ? "border-primary/40 bg-primary/5"
                          : status === "nok"
                          ? "border-destructive/40 bg-destructive/5"
                          : "bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex-1 text-sm font-medium">{item.label}</span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={status === "ok" ? "default" : "outline"}
                            onClick={() =>
                              setChecklistItem(truck.id, stageNum, item.id, { status: "ok" })
                            }
                          >
                            OK
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={status === "nok" ? "destructive" : "outline"}
                            onClick={() =>
                              setChecklistItem(truck.id, stageNum, item.id, {
                                status: "nok",
                                nc: ok?.nc ?? "",
                              })
                            }
                          >
                            NOK
                          </Button>
                        </div>
                      </div>
                      {status === "nok" && (
                        <div className="mt-3">
                          <Label htmlFor={`${item.id}-nc`} className="text-xs font-medium text-destructive">
                            Descreva a não conformidade
                          </Label>
                          <Textarea
                            id={`${item.id}-nc`}
                            className="mt-1"
                            placeholder="Detalhe o que foi identificado…"
                            value={ok?.nc ?? ""}
                            onChange={(e) =>
                              setChecklistItem(truck.id, stageNum, item.id, {
                                status: "nok",
                                nc: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              const checked = value === true;
              return (
                <div key={item.id}>
                  {groupHeader}
                  <label
                    htmlFor={item.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      checked ? "border-primary/40 bg-primary/5" : "bg-background hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox
                      id={item.id}
                      checked={checked}
                      onCheckedChange={(v) => setChecklistItem(truck.id, stageNum, item.id, v === true)}
                      className="h-5 w-5"
                    />
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {checked && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </label>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link to="/caminhao/$truckId" params={{ truckId: truck.id }}>
              <Button variant="outline" className="w-full sm:w-auto">Salvar e voltar</Button>
            </Link>
            {canFinishEarly && (
              <Button
                variant="outline"
                className="gap-2 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                onClick={() => setFinalizeOpen(true)}
                disabled={!complete}
              >
                <FlagOff className="h-4 w-4" />
                Finalizar serviço
              </Button>
            )}
            <Button onClick={handleAdvance} disabled={!complete} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {isLast
                ? "Concluir higienização"
                : `Avançar para Etapa ${stageNum + 1}`}
            </Button>
          </div>
        </Card>
        )}
      </main>
      <FinalizarAntecipadoDialog
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        onConfirm={({ motivo, justificativa }) => {
          finalizarAntecipado(truck.id, { motivo, justificativa });
          setFinalizeOpen(false);
          navigate({ to: "/" });
        }}
      />
    </div>
  );
}