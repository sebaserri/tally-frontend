// src/routes/reset-password.tsx
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  ErrorBanner,
  PageTitle,
  PasswordStrength,
  TextField,
} from "../components";
import { useResetPassword } from "../state/session";
import { useToast } from "../ui/toast/ToastProvider";

export default function ResetPasswordPage() {
  const { token } = useSearch({ from: "/reset-password" }) as {
    token?: string;
  };
  const nav = useNavigate();
  const { show } = useToast();

  const passRef = useRef<HTMLInputElement>(null);
  const confRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tPass, setTPass] = useState(false);
  const [tConf, setTConf] = useState(false);

  const passErr = useMemo(() => {
    if (!tPass) return "";
    return password.length >= 6 ? "" : "Mínimo 6 caracteres";
  }, [password, tPass]);

  const confErr = useMemo(() => {
    if (!tConf) return "";
    return password === confirm ? "" : "Las contraseñas no coinciden";
  }, [password, confirm, tConf]);

  const { mutateAsync, isPending, error, isSuccess } = useResetPassword();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTPass(true);
    setTConf(true);

    const pErr = password.length >= 6 ? "" : "Mínimo 6 caracteres";
    const cErr = password === confirm ? "" : "Las contraseñas no coinciden";

    if (!token) return;
    if (pErr) return passRef.current?.focus();
    if (cErr) return confRef.current?.focus();

    await mutateAsync({ token, password });
    show({
      variant: "success",
      title: "Password was reset!",
      description: `Password was reset.`,
    });
  };

  const disabled = isPending || !!passErr || !!confErr;

  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-6 px-2 sm:max-w-lg">
      <PageTitle>Definir nueva contraseña</PageTitle>

      <Card padding="lg">
        {!token ? (
          <div className="space-y-4">
            <ErrorBanner msg="Falta el token en la URL (?token=…)" />
            <Link to="/forgot-password" className="btn btn-ghost">
              Volver a recuperar
            </Link>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={onSubmit}
            noValidate
            aria-busy={isPending}
          >
            <TextField
              ref={passRef}
              label="Nueva contraseña"
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

            <ErrorBanner msg={(error as any)?.message} />
            {isSuccess && (
              <ErrorBanner
                variant="success"
                title="Actualizada"
                msg="¡Listo! Ya podés ingresar con tu nueva contraseña."
              />
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/login" className="link text-sm">
                Ir a Ingresar
              </Link>
              <Button
                type="submit"
                loading={isPending}
                loadingText="Guardando…"
                disabled={disabled}
              >
                Guardar contraseña
              </Button>
            </div>
          </form>
        )}
      </Card>

      {isSuccess && (
        <div className="flex justify-end">
          <button
            onClick={() => nav({ to: "/login" })}
            className="btn btn-primary"
          >
            Continuar a Login
          </button>
        </div>
      )}
    </div>
  );
}
