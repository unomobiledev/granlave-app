import { Flag, Bell, Pin, List, HelpCircle, ChevronDown, Search } from "lucide-react";
import granlaveLogo from "@/assets/granlave-logo.png";

const MENU_ITEMS = [
  "Assinatura Eletrônica",
  "FUP - Assinatura Eletrônica",
  "Faturamento do Mês",
  "Devoluções",
  "Cockpit de Diretoria",
  "Cockpit de Produtos",
  "Fechamento Periódico",
  "BI D3Dados",
  "Cockpit de Compras",
  "Cockpit de Vendas",
  "Portal Report",
  "BI (Dashboards)",
];

function GranlaveSidebarLogo() {
  return (
    <div className="flex w-full items-center justify-center px-2">
      <img
        src={granlaveLogo}
        alt="GranLave"
        className="h-16 w-auto object-contain"
      />
    </div>
  );
}

function UnoErpredict() {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="h-10 w-10">
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <path
            d="M32 6 a26 26 0 1 0 0.001 0 Z M32 14 a18 18 0 1 1 -0.001 0 Z"
            fill="#0a0a0a"
            fillRule="evenodd"
          />
        </svg>
      </div>
      <div className="text-base font-bold tracking-tight">
        <span className="text-foreground">UNO</span>
      </div>
      <div className="-mt-1 text-xs font-semibold tracking-tight">
        <span className="text-foreground">ERP</span>
        <span className="text-orange-500">redict</span>
      </div>
    </div>
  );
}

export function UnoFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-neutral-200 bg-white lg:flex">
        <div className="relative flex items-center justify-center px-4 pt-6 pb-4">
          <GranlaveSidebarLogo />
          <Pin className="absolute right-3 top-3 h-5 w-5 rotate-45 fill-orange-500 text-orange-500" />
        </div>
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              disabled
              placeholder="Busca por Código ou Descrição"
              className="w-full rounded border border-neutral-300 bg-white py-1.5 pl-8 pr-2 text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-0 py-1 text-[13px] text-neutral-800">
          <div className="bg-neutral-100 px-4 py-1.5 font-bold text-neutral-900">Gerência Geral</div>
          <ul>
            {MENU_ITEMS.map((item) => (
              <li
                key={item}
                className="cursor-default border-b border-neutral-100 px-4 py-1.5 hover:bg-neutral-50"
              >
                {item}
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col items-center gap-1 border-t border-neutral-200 px-4 py-4">
          <UnoErpredict />
          <div className="mt-1 text-[10px] text-neutral-500">By Uno Soluções</div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between bg-neutral-900 px-5 text-white">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide">CLÁSSICO</span>
            <HelpCircle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs">
              <span>2 - UNOSOL</span>
              <ChevronDown className="h-3 w-3" />
            </div>
            <div className="relative">
              <Flag className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-orange-500" />
            </div>
            <div className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-orange-500" />
            </div>
            <Pin className="h-5 w-5" />
            <List className="h-5 w-5" />
            <div className="h-8 w-8 overflow-hidden rounded-full bg-neutral-700">
              <img
                src="https://i.pravatar.cc/64?img=12"
                alt="Usuário UNO"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* App content area (white) */}
        <div className="min-h-0 flex-1 overflow-auto bg-white">{children}</div>
      </div>
    </div>
  );
}