import { ComponentProps, JSX, ReactNode } from "react";
import { clsx } from "clsx";

type CardTone = "default" | "info" | "success" | "warning" | "danger";
type CardPadding = "none" | "sm" | "md" | "lg";
type CardShadow = "none" | "sm" | "md" | "lg";

export interface CardProps extends ComponentProps<"div"> {
  tone?: CardTone;
  padding?: CardPadding;
  shadow?: CardShadow;
  interactive?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

const toneClasses: Record<CardTone, string> = {
  default:
    "bg-white/80 dark:bg-neutral-900/80 border-neutral-200/70 dark:border-neutral-800/70",
  info: "bg-sky-50/70 dark:bg-sky-950/20 border-sky-200/70 dark:border-sky-800/60",
  success:
    "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/60",
  warning:
    "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/60",
  danger:
    "bg-red-50/70 dark:bg-red-950/20 border-red-200/70 dark:border-red-800/60",
};

const padClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const shadowClasses: Record<CardShadow, string> = {
  none: "shadow-none",
  sm: "shadow-md",
  md: "shadow-lg",
  lg: "shadow-xl",
};

export function Card({
  className,
  tone = "default",
  padding = "md",
  shadow = "lg",
  interactive = false,
  header,
  footer,
  children,
  ...props
}: CardProps): JSX.Element {
  return (
    <div
      className={clsx(
        "rounded-2xl border backdrop-blur transition",
        toneClasses[tone],
        padClasses[padding],
        shadowClasses[shadow],
        interactive &&
          "hover:shadow-2xl hover:-translate-y-0.5 focus-within:shadow-2xl focus-within:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {header ? (
        <div className={clsx("mb-4", padding === "none" && "px-4 pt-4")}>
          {header}
        </div>
      ) : null}
      {children}
      {footer ? (
        <div className={clsx("mt-4", padding === "none" && "px-4 pb-4")}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export default Card;
