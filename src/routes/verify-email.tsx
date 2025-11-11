import { Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, ErrorBanner, PageTitle } from "../components";
import { useVerifyEmail } from "../state/session";

export default function VerifyEmailPage() {
  const { token } = useSearch({ from: "/verify-email" }) as { token?: string };
  const [done, setDone] = useState(false);
  const { mutateAsync, error, isPending } = useVerifyEmail();

  useEffect(() => {
    if (token) {
      mutateAsync(token)
        .then(() => setDone(true))
        .catch(() => setDone(false));
    }
  }, [token, mutateAsync]);

  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-6 px-2 sm:max-w-lg">
      <PageTitle>Verificación de Email</PageTitle>
      <Card padding="lg" className="space-y-4">
        {!token ? (
          <ErrorBanner msg="Falta el token en la URL (?token=…)" />
        ) : isPending ? (
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            Verificando tu correo…
          </div>
        ) : done ? (
          <ErrorBanner
            variant="success"
            title="Email verificado"
            msg="Tu email fue verificado correctamente."
          />
        ) : (
          <ErrorBanner msg={(error as any)?.message || "Error al verificar."} />
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/login" className="btn btn-primary">
            Ir a Ingresar
          </Link>
          <Link to="/resend-verification" className="btn btn-ghost">
            Reenviar verificación
          </Link>
        </div>
      </Card>
    </div>
  );
}
