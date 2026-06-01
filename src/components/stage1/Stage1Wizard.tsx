import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Search, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTrucksStore, type Truck } from "@/store/trucks";
import {
  buscarUltimoClientePorPlaca,
  type Cliente,
} from "@/lib/uno/clientes";
import { ClientePicker } from "./ClientePicker";

const TIPO_VEICULO_OPTIONS: { label: string; placas: number }[] = [
  { label: "Truck Tanque (1 placa)", placas: 1 },
  { label: "Cavalo / Carreta Tanque (2 placas)", placas: 2 },
  { label: "Cavalo / Bitren e Rodotren (3 placas)", placas: 3 },
];

function placasCount(tipo: string): number {
  return TIPO_VEICULO_OPTIONS.find((o) => o.label === tipo)?.placas ?? 0;
}

function getStr(state: Record<string, unknown>, key: string): string {
  const v = state[key];
  return typeof v === "string" ? v : "";
}

export function Stage1Wizard({ truck }: { truck: Truck }) {
  const navigate = useNavigate();
  const setChecklistItem = useTrucksStore((s) => s.setChecklistItem);
  const updateTruck = useTrucksStore((s) => s.updateTruck);
  const advanceStage = useTrucksStore((s) => s.advanceStage);

  const state = truck.checklists[1] ?? {};
  const tipoVeiculo = getStr(state, "tipo_veiculo");
  const nPlacas = placasCount(tipoVeiculo);

  // placa_1, placa_2, placa_3
  const placa1 = getStr(state, "placa_1");
  const placa2 = getStr(state, "placa_2");
  const placa3 = getStr(state, "placa_3");

  // Cliente (id + razão social armazenados separados)
  const clienteId = getStr(state, "cliente_id");
  const clienteRazao = getStr(state, "cliente") || truck.cliente;

  const setItem = (key: string, value: string) =>
    setChecklistItem(truck.id, 1, key, value);

  const handleTipo = (v: string) => {
    setItem("tipo_veiculo", v);
    // limpar placas extras se diminuiu
    const n = placasCount(v);
    if (n < 3) setItem("placa_3", "");
    if (n < 2) setItem("placa_2", "");
  };

  const setPlaca = (idx: 1 | 2 | 3, value: string) => {
    const up = value.toUpperCase();
    setItem(`placa_${idx}`, up);
    if (idx === 1) updateTruck(truck.id, { placa: up });
  };

  // --- Lookup por placa ---
  const [lookupState, setLookupState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "found"; cliente: Cliente }
    | { status: "notfound" }
  >({ status: "idle" });
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleBuscarPlaca = async () => {
    if (!placa1.trim()) return;
    setLookupState({ status: "loading" });
    try {
      const c = await buscarUltimoClientePorPlaca(placa1.trim());
      if (c) setLookupState({ status: "found", cliente: c });
      else {
        setLookupState({ status: "notfound" });
        setPickerOpen(true);
      }
    } catch {
      setLookupState({ status: "notfound" });
      setPickerOpen(true);
    }
  };

  const selecionarCliente = (c: Cliente) => {
    setItem("cliente_id", c.id);
    setItem("cliente", c.razaoSocial);
    setItem("cliente_fantasia", c.nomeFantasia);
    setItem("cliente_cnpj", c.cnpj);
    updateTruck(truck.id, { cliente: c.razaoSocial });
    setLookupState({ status: "found", cliente: c });
    setPickerOpen(false);
  };

  const limparCliente = () => {
    setItem("cliente_id", "");
    setItem("cliente", "");
    setItem("cliente_fantasia", "");
    setItem("cliente_cnpj", "");
    updateTruck(truck.id, { cliente: "" });
    setLookupState({ status: "idle" });
    setPickerOpen(true);
  };

  // Sincroniza motorista no nível do truck
  useEffect(() => {
    const mot = getStr(state, "motorista");
    if (mot && mot !== truck.motorista) updateTruck(truck.id, { motorista: mot });
  }, [state, truck.id, truck.motorista, updateTruck]);

  // --- Validações ---
  const placasOk =
    nPlacas >= 1 &&
    placa1.trim().length > 0 &&
    (nPlacas < 2 || placa2.trim().length > 0) &&
    (nPlacas < 3 || placa3.trim().length > 0);
  const clienteOk = clienteId.length > 0 && clienteRazao.length > 0;

  const requiredFinal = [
    "motorista",
    "transportador",
    "industria",
    "produto_higienizar",
    "ultima_carga",
    "sistema_higienizacao",
    "produto_higienizacao",
    "anvisa",
    "lote",
    "posicao_fila",
  ];
  const finalOk = requiredFinal.every((k) => getStr(state, k).trim().length > 0);
  const canAdvance = !!tipoVeiculo && placasOk && clienteOk && finalOk;

  const handleAdvance = () => {
    advanceStage(truck.id);
    navigate({ to: "/caminhao/$truckId", params: { truckId: truck.id } });
  };

  // Auto-trigger lookup state on mount if cliente já selecionado
  useEffect(() => {
    if (clienteId && lookupState.status === "idle") {
      setLookupState({
        status: "found",
        cliente: {
          id: clienteId,
          razaoSocial: clienteRazao,
          nomeFantasia: getStr(state, "cliente_fantasia"),
          cnpj: getStr(state, "cliente_cnpj"),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Passo A */}
      <StepCard step="A" title="Tipo de veículo">
        <Select value={tipoVeiculo} onValueChange={handleTipo}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de veículo..." />
          </SelectTrigger>
          <SelectContent>
            {TIPO_VEICULO_OPTIONS.map((opt) => (
              <SelectItem key={opt.label} value={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </StepCard>

      {/* Passo B */}
      {nPlacas > 0 && (
        <StepCard step="B" title="Placas do veículo">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: nPlacas }).map((_, i) => {
              const idx = (i + 1) as 1 | 2 | 3;
              const val = idx === 1 ? placa1 : idx === 2 ? placa2 : placa3;
              return (
                <div key={idx} className="space-y-1.5">
                  <Label htmlFor={`placa_${idx}`}>Placa {idx}</Label>
                  <Input
                    id={`placa_${idx}`}
                    value={val}
                    onChange={(e) => setPlaca(idx, e.target.value)}
                    placeholder="ABC-1D23"
                    className="font-mono uppercase"
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleBuscarPlaca}
              disabled={!placa1.trim() || lookupState.status === "loading"}
            >
              {lookupState.status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar cliente pela placa
            </Button>
          </div>
        </StepCard>
      )}

      {/* Passo C */}
      {nPlacas > 0 && (
        <StepCard step="C" title="Cliente">
          {lookupState.status === "found" && !pickerOpen ? (
            <Card className="flex items-start justify-between gap-3 border-primary/40 bg-primary/5 p-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Cliente vinculado
                </div>
                <div className="mt-1 font-semibold text-foreground">
                  {lookupState.cliente.razaoSocial}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lookupState.cliente.nomeFantasia} · {lookupState.cliente.cnpj}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={limparCliente} className="gap-1">
                <Pencil className="h-3 w-3" /> Trocar
              </Button>
            </Card>
          ) : pickerOpen || lookupState.status === "notfound" ? (
            <div className="space-y-2">
              {lookupState.status === "notfound" && (
                <p className="text-xs text-muted-foreground">
                  Nenhum cliente vinculado a essa placa. Busque ou cadastre um novo.
                </p>
              )}
              <ClientePicker onSelect={selecionarCliente} autoFocus />
              {clienteId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => setPickerOpen(false)}
                >
                  <X className="h-3 w-3" /> Cancelar troca
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Clique em <strong>Buscar cliente pela placa</strong> ou{" "}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="text-primary underline"
              >
                buscar manualmente
              </button>
              .
            </p>
          )}
        </StepCard>
      )}

      {/* Passo D */}
      {clienteOk && (
        <StepCard step="D" title="Dados da recepção">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Motorista" id="motorista" value={getStr(state, "motorista")} onChange={(v) => setItem("motorista", v)} />
            <Field label="Transportador" id="transportador" value={getStr(state, "transportador")} onChange={(v) => setItem("transportador", v)} />
            <Field label="Indústria de carregamento" id="industria" value={getStr(state, "industria")} onChange={(v) => setItem("industria", v)} />
            <Field label="Produto a higienizar" id="produto_higienizar" value={getStr(state, "produto_higienizar")} onChange={(v) => setItem("produto_higienizar", v)} />
            <Field label="Última carga" id="ultima_carga" value={getStr(state, "ultima_carga")} onChange={(v) => setItem("ultima_carga", v)} />
            <Field label="Penúltima carga" id="penultima_carga" value={getStr(state, "penultima_carga")} onChange={(v) => setItem("penultima_carga", v)} />
            <Field label="Antepenúltima carga" id="antepenultima_carga" value={getStr(state, "antepenultima_carga")} onChange={(v) => setItem("antepenultima_carga", v)} />
            <SelectField
              label="Sistema de higienização"
              id="sistema_higienizacao"
              value={getStr(state, "sistema_higienizacao")}
              onChange={(v) => setItem("sistema_higienizacao", v)}
              options={["Vapor", "Água quente"]}
            />
            <SelectField
              label="Produto de higienização"
              id="produto_higienizacao"
              value={getStr(state, "produto_higienizacao")}
              onChange={(v) => setItem("produto_higienizacao", v)}
              options={["Detergente", "Álcool"]}
            />
            <Field label="Registro Anvisa" id="anvisa" value={getStr(state, "anvisa")} onChange={(v) => setItem("anvisa", v)} />
            <Field label="Nº do lote" id="lote" value={getStr(state, "lote")} onChange={(v) => setItem("lote", v)} />
            <Field label="Posição na fila" id="posicao_fila" value={getStr(state, "posicao_fila")} onChange={(v) => setItem("posicao_fila", v)} />
          </div>
        </StepCard>
      )}

      <div className="flex justify-end">
        <Button onClick={handleAdvance} disabled={!canAdvance} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {truck.os ? "Salvar e avançar para Etapa 2" : "Abrir Ordem de Serviço"}
        </Button>
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {step}
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}