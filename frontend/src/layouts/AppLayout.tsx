import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowDownCircle,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";
import { cn } from "../utils/cn";
import { ExpenseFormModal } from "../components/finance/ExpenseFormModal";
import { useFinance } from "../hooks/useFinance";
import { useAuth } from "../hooks/useAuth";
import { formatCents } from "../lib/money";
import { buildSummary } from "../lib/selectors";
import { buildPeriod } from "../lib/dates";

const NAV = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/gastos", label: "Gastos", icon: Receipt, end: false },
  { to: "/cobrancas", label: "Cobranças", icon: HandCoins, end: false },
  { to: "/historico", label: "Histórico", icon: ArrowDownCircle, end: false },
];

export function AppLayout() {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const { transactions, charges } = useFinance();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const summary = buildSummary(transactions, charges, buildPeriod("month"));

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Wallet className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-[15px] font-semibold leading-tight">Vérti</p>
            <p className="text-[11.5px] text-slate-400">Finanças pessoais</p>
          </div>
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
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-3">
          <button
            onClick={() => setExpenseOpen(true)}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-[13.5px] font-medium text-white shadow-sm shadow-indigo-600/25 transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Novo gasto
          </button>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-[11.5px] font-medium text-slate-500">Saldo atual</p>
            <p
              className={cn(
                "mt-0.5 text-[15px] font-semibold tabular-nums",
                summary.balance >= 0 ? "text-slate-900" : "text-rose-600",
              )}
            >
              {formatCents(summary.balance)}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="truncate text-[11.5px] text-slate-500" title={user?.email}>
                {user?.name}
              </p>
              <button
                onClick={handleLogout}
                className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium text-slate-400 transition-colors hover:text-slate-600"
              >
                <LogOut className="h-3 w-3" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Wallet className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Vérti</p>
            <p className="text-[11px] text-slate-400">
              Saldo {formatCents(summary.balance)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpenseOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[13px] font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Gasto
        </button>
      </header>

      <main className="pb-24 lg:pb-10 lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors",
                  isActive ? "text-indigo-600" : "text-slate-400",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <ExpenseFormModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
    </div>
  );
}
