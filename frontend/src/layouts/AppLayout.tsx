import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowDownCircle,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Receipt,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { cn } from "../utils/cn";
import { BrandLogo } from "../components/BrandLogo";
import { ExpenseFormModal } from "../components/finance/ExpenseFormModal";
import { SpendCapBanner } from "../components/finance/SpendCapBanner";
import { useFinance } from "../hooks/useFinance";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { formatCents } from "../lib/money";
import { buildSummary } from "../lib/selectors";
import { buildPeriod } from "../lib/dates";

const NAV = [
  { to: "/", label: "Visão geral", shortLabel: "Geral", icon: LayoutDashboard, end: true },
  { to: "/gastos", label: "Gastos", shortLabel: "Gastos", icon: Receipt, end: false },
  { to: "/cobrancas", label: "Receita", shortLabel: "Receita", icon: HandCoins, end: false },
  { to: "/historico", label: "Histórico", shortLabel: "Histórico", icon: ArrowDownCircle, end: false },
  { to: "/configuracoes", label: "Configurações", shortLabel: "Ajustes", icon: Settings, end: false },
];

export function AppLayout() {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const { transactions, charges } = useFinance();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const summary = buildSummary(transactions, charges, buildPeriod("month"));

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <div className="px-5 py-5">
          <BrandLogo subtitle="Finanças pessoais" />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground-secondary hover:bg-surface-secondary hover:text-foreground",
                )
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form
          className="px-3 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("q");
            const q = typeof value === "string" ? value.trim() : "";
            navigate(q ? `/gastos?q=${encodeURIComponent(q)}` : "/gastos");
          }}
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
            <input
              name="q"
              type="search"
              placeholder="Buscar gasto..."
              className="h-9 w-full rounded-xl border border-border bg-surface-secondary pl-9 pr-3 text-[12.5px] text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </form>

        <div className="px-3 pb-3">
          <button
            onClick={() => setExpenseOpen(true)}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-[13.5px] font-medium text-white shadow-sm shadow-primary/25 transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Novo gasto
          </button>

          <div className="rounded-xl border border-border bg-surface-secondary/70 p-3">
            <p className="text-[11.5px] font-medium text-foreground-secondary">Saldo atual</p>
            <p
              className={cn(
                "mt-0.5 text-[15px] font-semibold tabular-nums",
                summary.balance >= 0 ? "text-foreground" : "text-danger",
              )}
            >
              {formatCents(summary.balance)}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="truncate text-[11.5px] text-foreground-secondary" title={user?.email}>
                {user?.name}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
                  className="text-foreground-muted transition-colors hover:text-foreground-secondary"
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium text-foreground-muted transition-colors hover:text-foreground-secondary"
                >
                  <LogOut className="h-3 w-3" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
        <BrandLogo size="sm" subtitle={`Saldo ${formatCents(summary.balance)}`} />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary hover:bg-surface-secondary"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Gasto
          </button>
        </div>
      </header>

      <main className="pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-10 lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
          <SpendCapBanner />
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-foreground-muted",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.shortLabel}
            </NavLink>
          ))}
        </div>
      </nav>

      <ExpenseFormModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
    </div>
  );
}
