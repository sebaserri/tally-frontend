// src/routes/forgot-password.tsx
import { Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Button, Card, ErrorBanner, PageTitle, TextField } from "../components";
import { useForgotPassword } from "../state/session";

const MailIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      d="M4 6h16v12H4z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinejoin="round"
    />
    <path
      d="M22 6l-10 7L2 6"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export default function ForgotPasswordPage() {
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const { mutateAsync, isPending, error, isSuccess } = useForgotPassword();

  const emailErr = useMemo(() => {
    if (!touched) return "";
    if (!email) return "El email es obligatorio";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return ok ? "" : "Formato de email inválido";
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
      <PageTitle subtitle="Te enviaremos un enlace para restablecerla si el correo existe.">
        Recuperar contraseña
      </PageTitle>

      <Card padding="lg" className="space-y-4">
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
            autoComplete="email"
            required
            aria-invalid={!!emailErr}
            value={email}
            onBlur={() => setTouched(true)}
            onChange={(e) => setEmail(e.currentTarget.value)}
            leftIcon={MailIcon}
            help="Usá el email con el que te registraste."
            error={emailErr}
            placeholder="tu@email.com"
            inputMode="email"
          />

          <ErrorBanner msg={(error as any)?.message} />

          {isSuccess && (
            <ErrorBanner
              variant="success"
              title="Enviado"
              msg="Si el email existe, te enviamos un link para restablecer."
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
              Enviar enlace
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
