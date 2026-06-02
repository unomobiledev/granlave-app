import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Truck as TruckIcon,
  CheckCircle2,
  ChevronRight,
  Clock,
  RotateCcw,
  FlagOff,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { STAGES } from "@/data/stages";
import { useTrucksStore } from "@/store/trucks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import {
  listarUltimasOS,
  listarOSsNaFila,
  listarOSsEmAtendimento,
  listarOSsConcluidas,
  mapOSToCardData,
  type OS,
  type OSCardData,
} from "@/lib/uno/os";
import { UnoApiError } from "@/lib/uno/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GranLave — Controle de Higienização" },
      { name: "description", content: "Sistema de controle de etapas de higienização de tanques de caminhão." },
    ],
  }),
  component: Index,
});

function Index() {
  const seedMock = useTrucksStore((s) => s.seedMock);
  const resetMock = useTrucksStore((s) => s.resetMock);

  useEffect(() => {
    seedMock();
  }, [seedMock]);

  return (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        <FilaSection onReset={resetMock} />
        <AtendimentoSection />
        <ConcluidosSection />
        <section>
          <UltimasOSSection />
        </section>
      </main>
    </div>
  );
}

/* ===========================================================
 * Blocos por status (todos vindos da API UNO — mock por enquanto)
 * =========================================================== */

function FilaSection({ onReset }: { onReset: () => void }) {
  const q = useQuery({
    queryKey: ["uno", "os", "status", "AGUARDANDO_FILA"],
    queryFn: () => listarOSsNaFila(),
  });
  const rows = (q.data ?? []).map(mapOSToCardData);
  return (
    <section>
      <SectionHeader
        title="Veículos na fila"
        count={rows.length}
        action={
          <Button variant="outline" size="sm" className="gap-2" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" /> Resetar mockup
          </Button>
        }
      />
      <StatusBlockBody
        query={q}
        rows={rows}
        emptyMessage="Fila vazia."
        skeletonCount={3}
        render={(rows) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r, i) => (
              <QueueCard key={r.id} os={r} position={i + 1} />
            ))}
          </div>
        )}
      />
    </section>
  );
}

function AtendimentoSection() {
  const q = useQuery({
    queryKey: ["uno", "os", "status", "EM_ATENDIMENTO"],
    queryFn: () => listarOSsEmAtendimento(),
  });
  const rows = (q.data ?? []).map(mapOSToCardData);
  return (
    <section>
      <SectionHeader title="Veículos em atendimento" count={rows.length} />
      <StatusBlockBody
        query={q}
        rows={rows}
        emptyMessage="Nenhum veículo em atendimento."
        skeletonCount={4}
        render={(rows) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((r) => (
              <AtendimentoCard key={r.id} os={r} />
            ))}
          </div>
        )}
      />
    </section>
  );
}

function ConcluidosSection() {
  const q = useQuery({
    queryKey: ["uno", "os", "status", "CONCLUIDO", 8],
    queryFn: () => listarOSsConcluidas(8),
  });
  const rows = (q.data ?? []).map(mapOSToCardData);
  return (
    <section>
      <SectionHeader title="Veículos concluídos" count={rows.length} />
      <StatusBlockBody
        query={q}
        rows={rows}
        emptyMessage="Nenhum veículo concluído ainda."
        skeletonCount={4}
        render={(rows) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((r) => (
              <ConcluidoCard key={r.id} os={r} />
            ))}
          </div>
        )}
      />
    </section>
  );
}

function StatusBlockBody({
  query,
  rows,
  emptyMessage,
  skeletonCount,
  render,
}: {
  query: { isLoading: boolean; isError: boolean; error: unknown; refetch: () => void };
  rows: OSCardData[];
  emptyMessage: string;
  skeletonCount: number;
  render: (rows: OSCardData[]) => React.ReactNode;
}) {
  if (query.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return (
      <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-destructive">Não foi possível carregar.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {(query.error as Error)?.message ?? "Erro desconhecido"}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
          Tentar novamente
        </Button>
      </Card>
    );
  }
  if (rows.length === 0) return <EmptyBlock message={emptyMessage} />;
  return <>{render(rows)}</>;
}

function UltimasOSSection() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["uno", "os", "ultimas", 10],
    queryFn: () => listarUltimasOS(10),
    retry: (count, err) => !(err instanceof UnoApiError && err.status === 401) && count < 2,
  });

  const rows = data?.content ?? [];

  return (
    <>
      <SectionHeader
        title="Últimas OSs (UNO ERP)"
        count={rows.length}
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
        }
      />
      {isLoading ? (
        <Card className="p-4">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </Card>
      ) : isError ? (
        <Card className="border-destructive/40 bg-destructive/5 p-6 text-sm">
          <p className="font-medium text-destructive">
            Não foi possível carregar as OSs do UNO.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(error as Error)?.message ?? "Erro desconhecido"}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </Card>
      ) : rows.length === 0 ? (
        <EmptyBlock message="Nenhuma OS encontrada." />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((os, i) => (
                <TableRow key={String(os.id ?? os.numero ?? i)}>
                  <TableCell className="font-mono text-xs">
                    {String(os.numero ?? os.numeroOs ?? os.id ?? "—")}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(os.dataEmissao ?? os.data)}
                  </TableCell>
                  <TableCell className="text-xs">{formatCliente(os)}</TableCell>
                  <TableCell className="text-xs">
                    {String(os.situacao ?? os.status ?? "—")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}

function formatDate(value: unknown): string {
  if (!value || typeof value !== "string") return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function formatCliente(os: OS): string {
  if (typeof os.cliente === "string") return os.cliente;
  if (os.cliente && typeof os.cliente === "object") {
    return os.cliente.nome ?? os.cliente.razaoSocial ?? "—";
  }
  return os.clienteNome ?? "—";
}

function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {count}
        </span>
      </div>
      {action}
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <Card className="border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
      {message}
    </Card>
  );
}

function QueueCard({ os, position }: { os: OSCardData; position: number }) {
  const waiting = os.dataEmissao
    ? Math.max(0, Math.floor((Date.now() - new Date(os.dataEmissao).getTime()) / 60000))
    : 0;
  return (
    <Link to="/os/$codOs" params={{ codOs: os.codOs }} className="group block">
      <Card className="flex items-center gap-3 border-amber-300/60 bg-gradient-to-br from-amber-50 to-amber-100/60 p-4 transition-all hover:shadow-md group-hover:-translate-y-0.5">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-500 font-bold leading-none text-white">
          <span className="text-lg">{position}º</span>
          <span className="text-[9px] uppercase tracking-wider opacity-90">fila</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/80">
            {os.os}
          </div>
          <div className="truncate font-mono text-sm font-semibold text-foreground">{os.placa}</div>
          <div className="truncate text-xs text-muted-foreground">{os.cliente}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {waiting}min
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </Link>
  );
}

function AtendimentoCard({ os }: { os: OSCardData }) {
  const etapa = os.etapaAtual ?? 1;
  const minutes = os.dataEmissao
    ? Math.max(0, Math.floor((Date.now() - new Date(os.dataEmissao).getTime()) / 60000))
    : 0;
  return (
    <Link to="/os/$codOs" params={{ codOs: os.codOs }} className="group block">
      <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20 p-5 shadow-md transition-all hover:shadow-lg group-hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <TruckIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                {os.os}
              </div>
              <div className="truncate font-mono text-base font-semibold text-foreground">
                {os.placa}
              </div>
              <div className="truncate text-xs text-muted-foreground">{os.cliente}</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>

        <div className="mt-5 rounded-lg border bg-background/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium uppercase tracking-wider text-muted-foreground">
              Etapa {etapa} de {STAGES.length}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" /> {minutes}min
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ConcluidoCard({ os }: { os: OSCardData }) {
  const fa = os.finalizadoAntecipado;
  return (
    <Link to="/os/$codOs" params={{ codOs: os.codOs }} className="group block">
    <Card className="flex items-start gap-3 border-emerald-300/50 bg-emerald-50/40 p-4 transition-all hover:shadow-md group-hover:-translate-y-0.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        {fa ? <FlagOff className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          {os.os}
        </div>
        <div className="truncate font-mono text-sm font-semibold text-foreground">{os.placa}</div>
        <div className="truncate text-xs text-muted-foreground">{os.cliente}</div>
        {fa ? (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            Finalizado antecipadamente — Etapa {fa.etapa}
          </div>
        ) : (
          <div className="mt-1 text-[10px] text-emerald-700">Concluído</div>
        )}
      </div>
    </Card>
    </Link>
  );
}
