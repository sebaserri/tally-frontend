import { useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { useState } from "react";
import { Button } from ".";
import { useResendVerification } from "../state/session";

type Props = { className?: string };

export default function UnverifiedEmailBanner({ className }: Props) {
  const qc = useQueryClient();
  const me = qc.getQueryData<any>(["me"]); // SessionUser | null (puede traer emailVerified?)
  const [sent, setSent] = useState(false);
  const resend = useResendVerification();

  if (!me || me.emailVerifiedAt) return null; // null = no verificado

  const onResend = async () => {
    if (!me?.email || resend.isPending) return;
    await resend.mutateAsync(me.email);
    setSent(true);
  };

  return (
    <div
      className={clsx("mx-auto max-w-6xl px-4", className)}
      role="region"
      aria-label="Estado de verificación de email"
    >
      <div className="flex flex-col items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          Tu email <strong>{me.email}</strong> aún no está verificado. Algunas
          funciones pueden estar limitadas.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={onResend}
            loading={resend.isPending}
            loadingText="Enviando…"
            disabled={sent}
          >
            {sent ? "Enviado" : "Reenviar verificación"}
          </Button>
        </div>
      </div>
    </div>
  );
}
