import { clsx } from "clsx";
import { ReactNode, useId, useState } from "react";

type BannerVariant = "error" | "warning" | "info" | "success";

const variantStyles: Record<
  BannerVariant,
  { wrap: string; text: string; border: string; icon: ReactNode }
> = {
  error: {
    wrap: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  warning: {
    wrap: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  info: {
    wrap: "bg-sky-50",
    text: "text-sky-900",
    border: "border-sky-200",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  success: {
    wrap: "bg-emerald-50",
    text: "text-emerald-900",
    border: "border-emerald-200",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M20 6l-11 11-5-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};

export interface ErrorBannerProps {
  msg?: string;
  title?: string;
  variant?: BannerVariant;
  onClose?: () => void;
  className?: string;
}

export default function ErrorBanner({
  msg,
  title,
  variant = "error",
  onClose,
  className,
}: ErrorBannerProps) {
  const [open, setOpen] = useState(true);
  const id = useId();
  if (!msg || !open) return null;

  const styles = variantStyles[variant];
  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={clsx(
        "rounded-xl border px-4 py-3 text-sm flex items-start gap-3",
        styles.wrap,
        styles.text,
        styles.border,
        className
      )}
    >
      <span className="mt-0.5">{styles.icon}</span>
      <div className="flex-1">
        {title && (
          <p id={`${id}-title`} className="font-medium">
            {title}
          </p>
        )}
        <p id={`${id}-desc`}>{msg}</p>
      </div>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={handleClose}
        className="rounded-md p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-black/10"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
