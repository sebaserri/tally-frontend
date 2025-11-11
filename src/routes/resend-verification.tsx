// src/routes/resend-verification.tsx
import { Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Button, Card, ErrorBanner, PageTitle, TextField } from "../components";
import { useResendVerification } from "../state/session";

const MailIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      d="M22 6l-10 7L2 6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export default function ResendVerificationPage() {
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const { mutateAsync, isPending, error, isSuccess } = useResendVerification();

  const emailErr = useMemo(() => {
    if (!touched) return "";
    if (!email) return "El email es obligatorio";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Formato inválido";
  }, [email, touched]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (emailErr) {
      emailRef.current?.focus();
      return;
    }
    await mutateAsync(email);
  };

  const disabled = isPending || !!emailErr || !email;

  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-6 px-2 sm:max-w-lg">
      <PageTitle subtitle="Te enviaremos un nuevo enlace si tu email no fue verificado.">
        Reenviar verificación
      </PageTitle>
      <Card padding="lg">
        <form
          className="space-y-5"
          onSubmit={onSubmit}
          noValidate
          aria-busy={isPending}
        >
          <TextField
            ref={emailRef}
            label="Email"
            type="email"
            required
            aria-invalid={!!emailErr}
            value={email}
            onBlur={() => setTouched(true)}
            onChange={(e) => setEmail(e.currentTarget.value)}
            leftIcon={MailIcon}
            error={emailErr}
            placeholder="tu@email.com"
            inputMode="email"
            autoComplete="email"
          />

          <ErrorBanner msg={(error as any)?.message} />
          {isSuccess && (
            <ErrorBanner
              variant="success"
              title="Enviado"
              msg="Si el email existe y aún no fue verificado, te enviamos un nuevo enlace."
            />
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/login" className="link text-sm">
              Volver a ingresar
            </Link>
            <Button
              type="submit"
              loading={isPending}
              loadingText="Enviando…"
              disabled={disabled}
            >
              Reenviar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
