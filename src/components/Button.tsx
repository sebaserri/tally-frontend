// src/components/Button.tsx
import { clsx } from "clsx";
import { ComponentProps, forwardRef, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ComponentProps<"button">, "color"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-5 py-3 text-base rounded-2xl",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary", // relies on your Tailwind layer (.btn + .btn-primary)
  ghost: "btn-ghost",
  secondary:
    "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200",
  outline:
    "bg-transparent border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const Spinner = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden="true">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
    />
    <path
      className="opacity-75"
      d="M4 12a8 8 0 018-8"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      loading,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      type,
      disabled,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        aria-busy={loading || undefined}
        aria-live={loading ? "polite" : undefined}
        disabled={isDisabled}
        className={clsx(
          "btn inline-flex select-none items-center justify-center gap-2 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && "w-full",
          isDisabled && "opacity-60 pointer-events-none",
          className
        )}
        {...props}
      >
        {loading && <Spinner />}
        {loading ? (
          loadingText ?? children
        ) : (
          <>
            {leftIcon}
            <span>{children}</span>
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

export default Button;
export type { ButtonProps as Props };
