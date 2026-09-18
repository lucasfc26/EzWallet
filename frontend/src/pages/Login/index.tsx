import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Wallet } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card";
import { Input } from "../../components/ui/Field";
import { Button } from "../../components/ui/Button";
import { useAuth, authErrorMessage } from "../../hooks/useAuth";

const schema = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!loading && user) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(authErrorMessage(err, "Não foi possível entrar."));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Wallet className="h-5 w-5" />
          </span>
          <p className="text-lg font-semibold text-slate-900">Vérti</p>
          <p className="text-sm text-slate-500">Entre para continuar</p>
        </div>

        <Card className="shadow-sm">
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                id="email"
                type="email"
                label="E-mail"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <Input
                id="password"
                type="password"
                label="Senha"
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
              />

              {formError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-600">
                  {formError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                loading={isSubmitting}
                icon={<LogIn className="h-4 w-4" />}
              >
                Entrar
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-[13px] text-slate-500">
          Não tem uma conta?{" "}
          <Link to="/registrar" className="font-medium text-indigo-600 hover:text-indigo-700">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
