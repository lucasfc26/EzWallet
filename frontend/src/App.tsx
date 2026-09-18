import { createHashRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import DashboardPage from "./pages/Dashboard";
import ExpensesPage from "./pages/Expenses";
import ChargesPage from "./pages/Charges";
import HistoryPage from "./pages/History";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import { FinanceProvider } from "./hooks/useFinance";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./hooks/useToast";
import { Toaster } from "./components/ui/Toaster";
import { RequireAuth } from "./components/RequireAuth";

const router = createHashRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/registrar", element: <RegisterPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <FinanceProvider>
          <AppLayout />
        </FinanceProvider>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "gastos", element: <ExpensesPage /> },
      { path: "cobrancas", element: <ChargesPage /> },
      { path: "historico", element: <HistoryPage /> },
      { path: "*", element: <DashboardPage /> },
    ],
  },
]);

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ToastProvider>
  );
}
