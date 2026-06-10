import { createFileRoute, Link } from "@tanstack/react-router";
import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buscarOSPorCodigo, type OSDetalhe } from "@/lib/uno/os-detalhe";
import { listarSituacoesOS, type OSSituacao } from "@/lib/uno/os-situacoes";
import {
  listarItensModeloChecklist,
  listarModelosChecklist,
  type ChecklistItemModelo,
  type ChecklistModelo,
} from "@/lib/uno/checklist-modelos";
import { DEV_RESTRICT_OS_STATUS_1_6, DEV_OS_STATUS_ALLOWED } from "@/lib/uno/dev-flags";
import { useState } from "react";

const osDetalheQueryOptions = (codOs: string, codAtendimento: number) =>
  queryOptions({
    queryKey: ["uno", "os", "detalhe", codOs, codAtendimento],
    queryFn: () => buscarOSPorCodigo(codOs, codAtendimento),
  });

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

const itensChecklistQueryOptions = (idModeloChecklist: number) =>
  queryOptions({
    queryKey: ["uno", "checklist", "itens", idModeloChecklist],
    queryFn: () => listarItensModeloChecklist(idModeloChecklist),
    staleTime: 5 * 60_000,
  });

type OSDetalheSearch = { atend: number };

function validateOSDetalheSearch(input: Record<string, unknown>): OSDetalheSearch {
  const raw = input?.atend;
  const n = typeof raw === "number" ? raw : Number(raw);
  return { atend: Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0 };
}

export const Route = createFileRoute("/os/$codOs")({
  validateSearch: validateOSDetalheSearch,
  head: ({ params }) => ({
    meta: [{ title: `OS ${params.codOs} — GranLave` }],
  }),
  loaderDeps: ({ search }: { search: OSDetalheSearch }) => ({ atend: search.atend }),
  loader: ({ params, deps, context }: { params: { codOs: string }; deps: { atend: number }; context: { queryClient: import("@tanstack/react-query").QueryClient } }) => {
    if (!deps.atend) return;
    context.queryClient.ensureQueryData(
      osDetalheQueryOptions(params.codOs, deps.atend),
    );
    context.queryClient.ensureQueryData(situacoesQueryOptions);
    context.queryClient.ensureQueryData(modelosChecklistQueryOptions);
    return;
  },
  errorComponent: ({ error }) => (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Não foi possível carregar a OS.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(error as Error)?.message ?? "Erro desconhecido"}
          </p>
        </Card>
      </main>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card className="p-4 text-sm">OS não encontrada.</Card>
      </main>
    </div>
  ),
  component: OSDetalhePage,
});

function OSDetalhePage() {
  const { codOs } = Route.useParams();
  const { atend } = Route.useSearch();

  if (!atend) {
    return (
      <div className="min-h-full bg-muted/30">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-6 py-8">
          <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">
              Atendimento não informado.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              É necessário acessar a OS pela lista para incluir o código de atendimento.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const { data } = useSuspenseQuery(osDetalheQueryOptions(codOs, atend));

  return (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Ordem de Serviço
          </div>
          <h1 className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {String(data.numero ?? data.codOs)}
          </h1>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Info label="Placa" value={data.placa} />
            <Info label="Cliente" value={formatCliente(data)} />
            <Info label="Status" value={data.status} />
            <Info label="Categoria" value={data.descricaoCategoria ?? data.categoria} />
            <Info label="Abertura" value={formatDate(data.dtAbertura)} />
            <Info label="Previsão" value={formatDate(data.dtPrevisaoConclusao)} />
            <Info label="Contato" value={data.nomeContato} />
            <Info
              label="Telefone"
              value={data.telefone ? `(${data.ddd ?? ""}) ${data.telefone}` : undefined}
            />
          </div>
        </Card>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Raw UNO (debug)
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-3 text-[11px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>

        <SituacoesSection codStatusAtual={data.codStatus} />

        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link to="/">Voltar ao painel</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function SituacoesSection({ codStatusAtual }: { codStatusAtual?: number }) {
  const { data: situacoes } = useSuspenseQuery(situacoesQueryOptions);
  const { data: modelos } = useSuspenseQuery(modelosChecklistQueryOptions);

  // Mostra apenas as etapas iniciais do fluxo (códigos 1 a 6).
  const etapas = situacoes
    .filter(
      (s) =>
        !DEV_RESTRICT_OS_STATUS_1_6 ||
        (DEV_OS_STATUS_ALLOWED as readonly number[]).includes(s.codigo),
    )
    .sort((a, b) => a.codigo - b.codigo);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Etapas da OS</h2>
      {etapas.map((s) => (
        <SituacaoCard
          key={s.codigo}
          situacao={s}
          atual={s.codStatus === codStatusAtual}
          modelo={findModeloForSituacao(modelos, s)}
        />
      ))}
    </section>
  );
}

function findModeloForSituacao(
  modelos: ChecklistModelo[],
  situacao: OSSituacao,
): ChecklistModelo | undefined {
  return modelos.find(
    (m) =>
      m.codSituacao === situacao.codigo ||
      m.codStatus === situacao.codStatus,
  );
}

function SituacaoCard({
  situacao,
  atual,
  modelo,
}: {
  situacao: OSSituacao;
  atual: boolean;
  modelo?: ChecklistModelo;
}) {
  const [open, setOpen] = useState(false);
  const idModelo = (modelo?.id ?? modelo?.codigo) as number | undefined;

  return (
    <Card className={`p-4 ${atual ? "border-primary/60 ring-1 ring-primary/30" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Etapa #{situacao.codigo}
          </div>
          <div className="text-sm font-medium text-foreground">
            {situacao.descAbrev ?? situacao.descricaoAbreviada ?? situacao.descricao}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {atual ? "Atual" : open ? "Fechar" : "Abrir"}
        </div>
      </button>

      {open && (
        <div className="mt-3 border-t pt-3">
          {idModelo ? (
            <ChecklistItens idModeloChecklist={idModelo} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum modelo de checklist vinculado a esta etapa.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function ChecklistItens({ idModeloChecklist }: { idModeloChecklist: number }) {
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

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-foreground">
        {value === undefined || value === null || value === "" ? "—" : String(value)}
      </div>
    </div>
  );
}

function formatCliente(os: OSDetalhe): string | undefined {
  if (typeof os.cliente === "string") return os.cliente;
  if (os.cliente && typeof os.cliente === "object") {
    return os.cliente.nome ?? os.cliente.razaoSocial;
  }
  return undefined;
}

function formatDate(value: unknown): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}