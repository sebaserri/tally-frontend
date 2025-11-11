// src/pages/login.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card, ErrorBanner } from "../components";
import { useLogin } from "../state/session";
import { useToast } from "../ui/toast/ToastProvider";

const loginSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

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

export default function LoginPage() {
  const nav = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const searchParams = new URLSearchParams(location.searchStr ?? "");
  const nextParam = searchParams.get("next");

  const { show } = useToast();

  const captchaRef = useRef<HTMLInputElement>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Brute-force guard
  const [failCount, setFailCount] = useState(0);
  const needsCaptcha = failCount >= 3;
  const [captchaOK, setCaptchaOK] = useState(false);
  const [captchaErr, setCaptchaErr] = useState("");

  const { mutateAsync, isPending, error } = useLogin();

  const onSubmit = async (data: LoginFormData) => {
    if (needsCaptcha && !captchaOK) {
      setCaptchaErr("Please confirm you're not a robot.");
      captchaRef.current?.focus();
      return;
    }
    setCaptchaErr("");

    try {
      const result = await mutateAsync(data);
      const role = result.user.role;

      show({
        variant: "success",
        title: "Welcome!",
        description: `Logged in as ${data.email}`,
      });

      // Redirect based on role or next param
      let redirectTo = nextParam || "/profile";

      if (!nextParam) {
        if (role === "ADMIN") {
          redirectTo = "/admin/cois";
        } else if (role === "GUARD") {
          redirectTo = "/guard/check";
        } else if (role === "VENDOR") {
          redirectTo = "/vendor";
        }
      }

      nav({ to: redirectTo, replace: true });
    } catch {
      setFailCount((c) => c + 1);
      setTimeout(() => {
        if (needsCaptcha && !captchaOK) captchaRef.current?.focus();
      }, 0);
    }
  };

  const isDisabled = isPending || (needsCaptcha && !captchaOK);

  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-6 px-2 sm:max-w-lg">
      <Card padding="lg" className="space-y-4">
        <form
          className="space-y-5"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-busy={isPending}
        >
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                {MailIcon}
              </div>
              <input
                {...register("email")}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="your@email.com"
                className="field pl-10"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                {LockIcon}
              </div>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="field pl-10"
                aria-invalid={!!errors.password}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

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
                <span>I'm not a robot</span>
              </label>
              {captchaErr && (
                <p className="text-xs text-red-600">{captchaErr}</p>
              )}
            </div>
          )}

          <ErrorBanner msg={(error as any)?.message} />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/forgot-password" className="link text-sm">
              Forgot password?
            </Link>
            <Button
              type="submit"
              loading={isPending}
              loadingText="Logging in…"
              disabled={isDisabled}
            >
              Log In
            </Button>
          </div>
        </form>
      </Card>

      <Card padding="md" className="flex items-center justify-between gap-4">
        <p className="text-sm dark:text-neutral-200">Don't have an account?</p>
        <Link to="/register" className="btn btn-ghost dark:text-neutral-200">
          Create Account
        </Link>
      </Card>

      <Card padding="md" className="flex items-center justify-between gap-4">
        <p className="text-sm dark:text-neutral-200">Didn't receive email?</p>
        <Link
          to="/resend-verification"
          className="btn btn-ghost dark:text-neutral-200"
        >
          Resend Verification
        </Link>
      </Card>
    </div>
  );
}
