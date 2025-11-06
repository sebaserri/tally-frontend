import { clsx } from "clsx";
import { ReactNode } from "react";

interface PageTitleProps {
  children: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function PageTitle({
  children,
  subtitle,
  actions,
  className,
}: PageTitleProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
          {children}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm md:text-base text-neutral-500">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
