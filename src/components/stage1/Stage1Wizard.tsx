import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Search, X, Pencil } from "lucide-react";
import { toast } from "sonner";
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
  buscarCodItemPorPlaca,
  type Cliente,
} from "@/lib/uno/clientes";
import { buscarUltimoClientePorCodItem } from "@/lib/uno/os";
import { criarOS } from "@/lib/uno/os-create";
import { ClientePicker } from "./ClientePicker";
import {
  listarProdutosCatalogo,
  type ProdutoHigienizacao,
} from "@/lib/uno/produtos-higienizacao";

function sanitizePlaca(v: string): string {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

function formatCelular(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
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
  const allTrucks = useTrucksStore((s) => s.trucks);

  const state = truck.checklists[1] ?? {};
  const placa = getStr(state, "placa_1");

  // Cliente (id + razão social armazenados separados)
  const clienteId = getStr(state, "cliente_id");
  const clienteRazao = getStr(state, "cliente") || truck.cliente;

  const setItem = (key: string, value: string) =>
    setChecklistItem(truck.id, 1, key, value);

  // --- Próxima posição na fila (auto) ---
  const nextPosicao = useMemo(() => {
    const max = allTrucks.reduce((m, t) => {
      if (t.id === truck.id) return m;
      const raw = getStr(t.checklists[1] ?? {}, "posicao_fila");
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
    return String(max + 1);
  }, [allTrucks, truck.id]);

  // Pré-preenche posicao_fila no rascunho se estiver vazio
  useEffect(() => {
    const current = getStr(state, "posicao_fila");
    if (!current) setItem("posicao_fila", nextPosicao);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPlaca = (value: string) => {
    const clean = sanitizePlaca(value);
    setItem("placa_1", clean);
    updateTruck(truck.id, { placa: clean });
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
    if (!placa.trim()) return;
    setLookupState({ status: "loading" });
    try {
      const codItem = await buscarCodItemPorPlaca(placa.trim());
      const c = codItem != null ? await buscarUltimoClientePorCodItem(codItem) : null;
      if (c) {
        selecionarCliente(c);
      } else {
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
    if (truck.codOsErp) return;
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
  const placaOk = placa.trim().length > 0;
  const clienteOk = clienteId.length > 0 && clienteRazao.length > 0;

  const requiredFinal = [
    "motorista",
    "transportador",
    "industria",
    "produto_higienizar",
    "ultima_carga",
    "sistema_higienizacao",
    "anvisa",
    "lote",
    "posicao_fila",
  ];
  const finalOk = requiredFinal.every((k) => getStr(state, k).trim().length > 0);
  const canAdvance = placaOk && clienteOk && finalOk;

  const [creating, setCreating] = useState(false);

  // Lista de produtos de higienização vinda do catálogo geral do UNO (cdq0201).
  // Disponível desde a abertura da etapa — não depende da OS existir.
  const [produtos, setProdutos] = useState<ProdutoHigienizacao[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [produtosErro, setProdutosErro] = useState<string | null>(null);

  const carregarProdutos = async () => {
    setLoadingProdutos(true);
    setProdutosErro(null);
    try {
      const resp = await listarProdutosCatalogo({ page: 0, size: 100 });
      setProdutos(resp.items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setProdutosErro(msg);
    } finally {
      setLoadingProdutos(false);
    }
  };

  // Carrega o catálogo de produtos uma única vez, ao montar a etapa.
  useEffect(() => {
    if (produtos.length === 0) {
      void carregarProdutos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cria a OS no ERP (se ainda não existe) assim que o cliente é confirmado.
  const ensureOsCriada = async (cliente: Cliente) => {
    if (truck.codOsErp) return;
    const codClienteNum = Number(cliente.id);
    if (!Number.isFinite(codClienteNum) || codClienteNum <= 0) return;
    setCreating(true);
    try {
      const motorista = getStr(state, "motorista") || truck.motorista || "—";
      const digits = getStr(state, "celular_digits");
      const ddd = digits.length >= 10 ? digits.slice(0, 2) : undefined;
      const telefone = digits.length >= 10 ? digits.slice(2) : undefined;
      const resp = await criarOS({
        codCliente: codClienteNum,
        nomeContato: motorista,
        ddd,
        telefone,
      });
      const codOsNum = Number(resp.codOs);
      const codAt = resp.codAtendimento ?? 1;
      updateTruck(truck.id, {
        os: String(resp.numero ?? resp.codOs),
        codOsErp: Number.isFinite(codOsNum) ? codOsNum : undefined,
        codAtendimentoErp: codAt,
      });
      if (Number.isFinite(codOsNum)) {
        void carregarProdutos(codOsNum, codAt);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Falha ao abrir OS no UNO: ${msg}`);
    } finally {
      setCreating(false);
    }
  };

  const handleAdvance = async () => {
    if (!truck.os) {
      // Caso o usuário avance sem ter passado pela criação automática
      // (ex.: cliente já estava setado antes do refactor).
      const cliente: Cliente = {
        id: clienteId,
        razaoSocial: clienteRazao,
        nomeFantasia: getStr(state, "cliente_fantasia"),
        cnpj: getStr(state, "cliente_cnpj"),
      };
      await ensureOsCriada(cliente);
      if (!useTrucksStore.getState().trucks.find((t) => t.id === truck.id)?.os) {
        return;
      }
    }
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
      <StepCard step="A" title="Placa do veículo">
        <div className="space-y-1.5">
          <Label htmlFor="placa_1">Placa</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <Input
              id="placa_1"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              placeholder="ABC1D23"
              maxLength={7}
              className="flex-1 font-mono uppercase"
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2 sm:shrink-0"
              onClick={handleBuscarPlaca}
              disabled={!placa.trim() || lookupState.status === "loading"}
            >
              {lookupState.status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar cliente
            </Button>
          </div>
        </div>
      </StepCard>

      {/* Passo B */}
      {(lookupState.status !== "idle" || clienteId) && (
        <StepCard step="B" title="Cliente">
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
                {truck.codOsErp && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    OS já aberta no ERP — cliente não pode mais ser alterado.
                  </div>
                )}
              </div>
              {!truck.codOsErp && (
                <Button variant="ghost" size="sm" onClick={limparCliente} className="gap-1">
                  <Pencil className="h-3 w-3" /> Trocar
                </Button>
              )}
            </Card>
          ) : pickerOpen || lookupState.status === "notfound" ? (
            <div className="space-y-2">
              {lookupState.status === "notfound" && (
                <p className="text-xs text-muted-foreground">
                  Nenhum cliente vinculado a essa placa. Busque ou cadastre um novo.
                </p>
              )}
              <ClientePicker
                onSelect={selecionarCliente}
                selected={
                  clienteId
                    ? {
                        id: clienteId,
                        razaoSocial: clienteRazao,
                        nomeFantasia: getStr(state, "cliente_fantasia"),
                        cnpj: getStr(state, "cliente_cnpj"),
                      }
                    : undefined
                }
                autoFocus
              />
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
              Clique em <strong>Buscar cliente</strong> ou{" "}
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

      {/* Passo C */}
      {clienteOk && (
        <StepCard step="C" title="Dados da recepção">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Motorista" id="motorista" value={getStr(state, "motorista")} onChange={(v) => setItem("motorista", v)} />
            <div className="space-y-1.5">
              <Label htmlFor="celular" className="text-sm font-medium">
                Celular
              </Label>
              <Input
                id="celular"
                value={getStr(state, "celular")}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setItem("celular_digits", digits);
                  setItem("celular", formatCelular(digits));
                }}
                placeholder="(11) 98765-4321"
                inputMode="numeric"
                maxLength={16}
              />
            </div>
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm font-medium">Produto de higienização</Label>
              <Select
                value={getStr(state, "produto_higienizacao_id")}
                onValueChange={(v) => {
                  const p = produtos.find((x) => x.codProduto === v);
                  if (!p) return;
                  setItem("produto_higienizacao_id", p.codProduto);
                  setItem("produto_higienizacao", p.descComercial);
                  setItem("produto_higienizacao_un", p.un);
                }}
                disabled={loadingProdutos || produtos.length === 0}
              >
                <SelectTrigger id="produto_higienizacao_select">
                  <SelectValue
                    placeholder={
                      loadingProdutos
                        ? "Carregando produtos..."
                        : produtos.length === 0
                          ? "Nenhum produto encontrado"
                          : "Selecione um produto"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((p) => (
                    <SelectItem key={p.codProduto} value={p.codProduto}>
                      {p.descComercial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {produtosErro && (
                <p className="text-xs text-destructive">{produtosErro}</p>
              )}
            </div>
            <Field label="Registro Anvisa" id="anvisa" value={getStr(state, "anvisa")} onChange={(v) => setItem("anvisa", v)} />
            <Field label="Nº do lote" id="lote" value={getStr(state, "lote")} onChange={(v) => setItem("lote", v)} />
            <Field label="Posição na fila" id="posicao_fila" value={getStr(state, "posicao_fila")} onChange={(v) => setItem("posicao_fila", v)} />
          </div>
        </StepCard>
      )}

      <div className="flex justify-end">
        <Button onClick={handleAdvance} disabled={!canAdvance || creating} className="gap-2">
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
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