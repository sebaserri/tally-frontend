// src/components/Breadcrumbs.tsx
import { Link, useRouterState } from "@tanstack/react-router";
import { clsx } from "clsx";

export default function Breadcrumbs({
  className,
}: {
  className?: string;
}): JSX.Element | null {
  const matches = useRouterState({ select: (s) => s.matches });

  // omit root
  const crumbs = matches.slice(1).filter((m) => m.routeId !== "/");

  if (!crumbs.length) return null;

  return (
    <nav
      aria-label="breadcrumbs"
      className={clsx(
        "mb-6 flex flex-wrap items-center gap-1 text-sm text-neutral-500",
        className
      )}
    >
      {crumbs.map((m, i) => {
        const isLast = i === crumbs.length - 1;
        const label =
          (m.staticData as any)?.breadcrumb ??
          (m.pathname === "/" ? "Inicio" : m.pathname.split("/").pop());
        return (
          <span key={m.routeId} className="flex items-center gap-1">
            {!isLast ? (
              <Link to={m.pathname} className="hover:text-neutral-800">
                {label}
              </Link>
            ) : (
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                {label}
              </span>
            )}
            {!isLast && <span className="opacity-50">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
