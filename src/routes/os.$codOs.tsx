import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/os/$codOs")({
  errorComponent: ({ error }) => (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">
            Não foi possível carregar a OS.
          </p>
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
  component: () => <Outlet />,
});