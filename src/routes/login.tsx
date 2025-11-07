// src/routes/login.tsx
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Button, Card, ErrorBanner, TextField } from "../components";
import { useLogin } from "../state/session";
import { useToast } from "../ui/toast/ToastProvider";

// ❗️No llamamos /auth/me acá. Solo cuando el usuario envía el form o entra a rutas protegidas.

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
const LockIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <rect
      x="4"
      y="10"
      width="16"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M8 10V7a4 4 0 118 0v3"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

const validateEmail = (v: string) => {
  if (!v.trim()) return "El email es obligatorio";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Formato inválido";
};
const validatePassword = (v: string) =>
  v ? "" : "La contraseña es obligatoria";

export default function LoginPage() {
  const nav = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const searchParams = new URLSearchParams(location.searchStr ?? "");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam !== "/login" ? nextParam : "/dashboard";

  const { show } = useToast();

  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const captchaRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [password, setPassword] = useState("");
  const [touchedPass, setTouchedPass] = useState(false);

  // brute-force guard
  const [failCount, setFailCount] = useState(0);
  const needsCaptcha = failCount >= 3;
  const [captchaOK, setCaptchaOK] = useState(false);
  const [captchaErr, setCaptchaErr] = useState("");

  const emailErr = useMemo(
    () => (touchedEmail ? validateEmail(email) : ""),
    [email, touchedEmail]
  );
  const passErr = useMemo(
    () => (touchedPass ? validatePassword(password) : ""),
    [password, touchedPass]
  );

  const { mutateAsync, isPending, error } = useLogin();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // marcar como "tocado" para mostrar errores
    setTouchedEmail(true);
    setTouchedPass(true);

    // validar _sincrónicamente_ para decidir foco y evitar llamadas
    const emailNow = validateEmail(email);
    const passNow = validatePassword(password);

    if (emailNow) {
      emailRef.current?.focus();
      return;
    }
    if (passNow) {
      passRef.current?.focus();
      return;
    }
    if (needsCaptcha && !captchaOK) {
      setCaptchaErr("Confirmá que no sos un robot.");
      captchaRef.current?.focus();
      return;
    }
    setCaptchaErr("");

    try {
      await mutateAsync({ email, password });
      show({
        variant: "success",
        title: "Welcome!",
        description: `Welcome ${email}.`,
      });
      nav({ to: next, replace: true });
    } catch {
      setFailCount((c) => c + 1);
      // si falló y ahora requiere captcha, mover el foco
      setTimeout(() => {
        if (needsCaptcha && !captchaOK) captchaRef.current?.focus();
      }, 0);
    }
  };

  const isDisabled =
    isPending || !!emailErr || !!passErr || (needsCaptcha && !captchaOK);

  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-6 px-2 sm:max-w-lg">
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
            inputMode="email"
            autoComplete="email"
            required
            aria-invalid={!!emailErr}
            value={email}
            onBlur={() => setTouchedEmail(true)}
            onChange={(e) => setEmail(e.currentTarget.value)}
            leftIcon={MailIcon}
            placeholder="tu@email.com"
            error={emailErr}
          />

          <TextField
            ref={passRef}
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={!!passErr}
            value={password}
            onBlur={() => setTouchedPass(true)}
            onChange={(e) => setPassword(e.currentTarget.value)}
            placeholder="••••••••"
            leftIcon={LockIcon}
            revealToggle
            error={passErr}
          />

          {/* Captcha simple condicional tras varios intentos fallidos */}
          {needsCaptcha && (
            <div className="space-y-1">
              <label className="flex items-center gap-3 text-sm">
                <input
                  ref={captchaRef}
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300"
                  checked={captchaOK}
                  onChange={(e) => {
                    setCaptchaOK(e.currentTarget.checked);
                    if (e.currentTarget.checked) setCaptchaErr("");
                  }}
                />
                <span>No soy un robot</span>
              </label>
              {captchaErr && (
                <p className="text-xs text-red-600">{captchaErr}</p>
              )}
            </div>
          )}

          <ErrorBanner msg={(error as any)?.message} />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/forgot-password" className="link text-sm">
              ¿Olvidaste tu contraseña?
            </Link>
            <Button
              type="submit"
              loading={isPending}
              loadingText="Ingresando…"
              disabled={isDisabled}
            >
              Ingresar
            </Button>
          </div>
        </form>
      </Card>

      <Card padding="md" className="flex items-center justify-between gap-4">
        <p className="text-sm dark:text-neutral-200">¿No tenés cuenta?</p>
        <Link to="/register" className="btn btn-ghost dark:text-neutral-200">
          Crear cuenta
        </Link>
      </Card>

      <Card padding="md" className="flex items-center justify-between gap-4">
        <p className="text-sm dark:text-neutral-200">¿No te llegó el email?</p>
        <Link to="/resend-verification" className="btn btn-ghost dark:text-neutral-200">
          Reenviar verificación
        </Link>
      </Card>
    </div>
  );
}
