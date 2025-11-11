import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  Card,
  ErrorBanner,
  PageTitle,
  PasswordStrength
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

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "El email es obligatorio")
      .email("Formato inválido"),
    name: z.string().optional(),
    vendorId: z.string().optional(),
    role: z.enum(["ADMIN", "VENDOR", "GUARD"]),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    acceptTos: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const qc = useQueryClient();
  const cachedMe = qc.getQueryData<SessionUser | null>(["me"]);
  const nav = useNavigate();
  const { show } = useToast();

  useEffect(() => {
    if (cachedMe) {
      const redirectPath =
        cachedMe.role === "ADMIN"
          ? "/admin"
          : cachedMe.role === "VENDOR"
          ? "/vendor"
          : "/guard/check";
      nav({ to: redirectPath, replace: true });
    }
  }, [cachedMe, nav]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      name: "",
      vendorId: "",
      role: "VENDOR",
      password: "",
      confirmPassword: "",
      acceptTos: false,
    },
  });

  const { mutateAsync, isPending, error } = useRegister();

  const password = watch("password");
  const role = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    await mutateAsync({
      email: data.email,
      password: data.password,
      role: data.role as Role,
      name: data.name || undefined,
      vendorId: data.vendorId || undefined,
    });

    show({
      variant: "success",
      title: "Welcome to Tally!",
      description: `Welcome ${data.email} to Tally!`,
    });

    const redirectPath =
      role === "ADMIN"
        ? "/admin"
        : role === "VENDOR"
        ? "/vendor"
        : "/guard/check";

    nav({ to: redirectPath, replace: true });
  };

  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-6 px-2 sm:max-w-2xl dark:text-neutral-200">
      <PageTitle subtitle="Completá tus datos para crear una cuenta.">
        Crear cuenta
      </PageTitle>

      <Card padding="lg">
        <form
          className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-busy={isPending}
        >
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Email *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {MailIcon}
              </div>
              <input
                type="email"
                {...register("email")}
                className="field pl-10"
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Nombre (opcional)
            </label>
            <input
              type="text"
              {...register("name")}
              className="field"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Rol *
            </label>
            <select {...register("role")} className="field">
              <option value="ADMIN">ADMIN</option>
              <option value="VENDOR">VENDOR</option>
              <option value="GUARD">GUARD</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Vendor ID (opcional)
            </label>
            <input
              type="text"
              {...register("vendorId")}
              className="field"
              autoComplete="off"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              {...register("password")}
              className="field"
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
            <PasswordStrength value={password} />
            <p className="text-xs text-neutral-500">
              Mínimo 6 caracteres. Recomendado 12+ con mayúsculas, números y
              símbolos.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Confirmar contraseña *
            </label>
            <input
              type="password"
              {...register("confirmPassword")}
              className="field"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                {...register("acceptTos")}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <span>
                Acepto los{" "}
                <a href="/terms" target="_blank" className="link">
                  Términos y condiciones
                </a>
                .
              </span>
            </label>
            {errors.acceptTos && (
              <p className="text-sm text-red-600 mt-1">
                {errors.acceptTos.message}
              </p>
            )}
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
                disabled={isPending || !isValid}
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
