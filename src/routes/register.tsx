import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  ErrorBanner,
  PageTitle,
  PasswordStrength,
  TextField,
} from "../components";
import { Role, SessionUser, useRegister } from "../state/session";
import { useToast } from "../ui/toast/ToastProvider";

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

const validateEmail = (v: string) => {
  if (!v.trim()) return "El email es obligatorio";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Formato inválido";
};
const validatePass = (v: string) =>
  v.length >= 6 ? "" : "Mínimo 6 caracteres";
const validateConf = (p: string, c: string) =>
  p === c ? "" : "Las contraseñas no coinciden";

export default function RegisterPage() {
  const qc = useQueryClient();
  const cachedMe = qc.getQueryData<SessionUser | null>(["me"]);
  const nav = useNavigate();

  const { show } = useToast();

  useEffect(() => {
    if (cachedMe) nav({ to: "/dashboard", replace: true });
  }, [cachedMe, nav]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [role, setRole] = useState<Role>("VENDOR");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [tEmail, setTEmail] = useState(false);
  const [tPass, setTPass] = useState(false);
  const [tConf, setTConf] = useState(false);
  const [acceptTos, setAcceptTos] = useState(false);

  // refs para auto-focus del primer error
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const confRef = useRef<HTMLInputElement>(null);

  const emailErr = useMemo(
    () => (tEmail ? validateEmail(email) : ""),
    [email, tEmail]
  );
  const passErr = useMemo(
    () => (tPass ? validatePass(password) : ""),
    [password, tPass]
  );
  const confErr = useMemo(
    () => (tConf ? validateConf(password, confirm) : ""),
    [password, confirm, tConf]
  );

  const { mutateAsync, isPending, error } = useRegister();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTEmail(true);
    setTPass(true);
    setTConf(true);

    const eErr = validateEmail(email);
    const pErr = validatePass(password);
    const cErr = validateConf(password, confirm);

    if (eErr) return emailRef.current?.focus();
    if (pErr) return passRef.current?.focus();
    if (cErr) return confRef.current?.focus();
    if (!acceptTos) return;

    await mutateAsync({
      email,
      password,
      role,
      name: name || undefined,
      vendorId: vendorId || undefined,
    });
    show({
      variant: "success",
      title: "Welcome to Tally!",
      description: `Welcome ${email} to Tally!.`,
    });
    // El backend ya inicia sesión y setea cookies → vamos al dashboard
    nav({ to: "/dashboard", replace: true });
  };

  const isDisabled =
    isPending || !!emailErr || !!passErr || !!confErr || !acceptTos;

  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-6 px-2 sm:max-w-2xl dark:text-neutral-200">
      <PageTitle subtitle="Completá tus datos para crear una cuenta.">
        Crear cuenta
      </PageTitle>

      <Card padding="lg">
        <form
          className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          onSubmit={onSubmit}
          noValidate
          aria-busy={isPending}
        >
          <div className="sm:col-span-2">
            <TextField
              ref={emailRef}
              label="Email"
              type="email"
              required
              value={email}
              onBlur={() => setTEmail(true)}
              onChange={(e) => setEmail(e.currentTarget.value)}
              leftIcon={MailIcon}
              error={emailErr}
              placeholder="tu@email.com"
              inputMode="email"
              autoComplete="email"
            />
          </div>

          <TextField
            label="Nombre (opcional)"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            autoComplete="name"
          />

          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Rol
            </label>
            <select
              className="mt-1 field w-full rounded-xl"
              value={role}
              onChange={(e) => setRole(e.currentTarget.value as Role)}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="VENDOR">VENDOR</option>
              <option value="GUARD">GUARD</option>
            </select>
          </div>

          <TextField
            label="Vendor ID (opcional)"
            value={vendorId}
            onChange={(e) => setVendorId(e.currentTarget.value)}
            autoComplete="off"
          />

          <div className="sm:col-span-2 space-y-2">
            <TextField
              ref={passRef}
              label="Contraseña"
              type="password"
              required
              value={password}
              onBlur={() => setTPass(true)}
              onChange={(e) => setPassword(e.currentTarget.value)}
              revealToggle
              error={passErr}
              autoComplete="new-password"
            />
            <PasswordStrength value={password} />
            <p className="text-xs text-neutral-500">
              Mínimo 6 caracteres. Recomendado 12+ con mayúsculas, números y
              símbolos.
            </p>
          </div>

          <div className="sm:col-span-2">
            <TextField
              ref={confRef}
              label="Confirmar contraseña"
              type="password"
              required
              value={confirm}
              onBlur={() => setTConf(true)}
              onChange={(e) => setConfirm(e.currentTarget.value)}
              revealToggle
              error={confErr}
              autoComplete="new-password"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300"
                checked={acceptTos}
                onChange={(e) => e.currentTarget.checked && setAcceptTos(true)}
              />
              <span>
                Acepto los{" "}
                <a href="/terms" target="_blank" className="link">
                  Términos y condiciones
                </a>
                .
              </span>
            </label>
          </div>

          <div className="sm:col-span-2 space-y-3">
            <ErrorBanner msg={(error as any)?.message} />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/login" className="link text-sm">
                Ya tengo cuenta
              </Link>
              <Button
                type="submit"
                loading={isPending}
                loadingText="Creando…"
                disabled={isDisabled}
              >
                Crear cuenta
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
