// src/routes/forgot-password.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card, ErrorBanner, PageTitle } from "../components";
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

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Formato de email inválido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { mutateAsync, isPending, error, isSuccess } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    await mutateAsync(data.email);
  };

  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-6 px-2 sm:max-w-lg">
      <PageTitle subtitle="Te enviaremos un enlace para restablecerla si el correo existe.">
        Recuperar contraseña
      </PageTitle>

      <Card padding="lg" className="space-y-4">
        <form
          className="space-y-5"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-busy={isPending}
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
              Email *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                {MailIcon}
              </div>
              <input
                type="email"
                {...register("email")}
                className="field pl-10"
                placeholder="tu@email.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
            <p className="text-xs text-neutral-500 mt-2">
              Usá el email con el que te registraste.
            </p>
          </div>

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
              disabled={isPending || !isValid}
            >
              Enviar enlace
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
