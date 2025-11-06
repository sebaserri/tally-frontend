import { clsx } from "clsx";
import {
  ComponentProps,
  ReactNode,
  forwardRef,
  useId,
  useMemo,
  useState,
} from "react";

export interface TextFieldProps extends ComponentProps<"input"> {
  label?: string;
  help?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  revealToggle?: boolean; // para type="password"
  fullWidth?: boolean;
  showCounter?: boolean; // si maxLength está presente
}

function safeId(id?: string) {
  try {
    // @ts-ignore - crypto may not exist in older envs
    return (
      id ??
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `id-${Math.random().toString(36).slice(2)}`)
    );
  } catch {
    return id ?? `id-${Math.random().toString(36).slice(2)}`;
  }
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      className,
      label,
      help,
      error,
      id,
      type = "text",
      leftIcon,
      rightIcon,
      revealToggle = true,
      fullWidth = true,
      showCounter = false,
      maxLength,
      required,
      ...props
    },
    ref
  ) {
    const inputId = useMemo(() => safeId(id), [id]);
    const [revealed, setRevealed] = useState(false);
    const describedBy: string[] = [];
    const helpId = useId();
    const errId = useId();
    if (help && !error) describedBy.push(helpId);
    if (error) describedBy.push(errId);

    const isPassword = type === "password";
    const inputType = isPassword && revealed ? "text" : type;

    const base =
      "block w-full rounded-xl border bg-white dark:bg-neutral-900 shadow-sm transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-neutral-700 placeholder:text-neutral-400 disabled:opacity-60 disabled:cursor-not-allowed";
    const wrapper =
      "relative flex items-center rounded-xl ring-1 ring-inset ring-transparent focus-within:ring-transparent";
    const withIconPadding =
      leftIcon || rightIcon || (isPassword && revealToggle)
        ? "pl-10 pr-10"
        : "";

    return (
      <div className={clsx("space-y-1", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
          >
            {label}
            {required ? <span className="text-red-600"> *</span> : null}
          </label>
        )}

        <div className={wrapper}>
          {leftIcon ? (
            <span className="pointer-events-none absolute left-3 text-neutral-400">
              {leftIcon}
            </span>
          ) : null}

          <input
            id={inputId}
            ref={ref}
            type={inputType}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy.join(" ") || undefined}
            className={clsx(
              "field",
              base,
              withIconPadding || "px-4 py-2.5",
              leftIcon && "pl-10",
              (rightIcon || (isPassword && revealToggle)) && "pr-10",
              error && "border-red-500 focus:ring-red-300 focus:border-red-500",
              className
            )}
            maxLength={maxLength}
            required={required}
            {...props}
          />

          {/* Right adornment priority: password toggle > rightIcon */}
          {isPassword && revealToggle ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label={
                revealed ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              onClick={() => setRevealed((v) => !v)}
              className={clsx(
                "absolute right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              )}
            >
              {revealed ? (
                // eye-off
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M3 3l18 18M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42M9.88 4.24A9.77 9.77 0 0112 4c5.52 0 9 6 9 6a16.36 16.36 0 01-3.21 3.73m-2.76 1.89A9.77 9.77 0 0112 20c-5.52 0-9-6-9-6a16.31 16.31 0 013.62-4.24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                // eye
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              )}
            </button>
          ) : rightIcon ? (
            <span className="absolute right-3 text-neutral-400">
              {rightIcon}
            </span>
          ) : null}
        </div>

        {showCounter && typeof maxLength === "number" ? (
          <div className="text-[11px] text-neutral-400 text-right">
            {props.value?.toString().length ?? 0}/{maxLength}
          </div>
        ) : null}

        {help && !error && (
          <p id={helpId} className="text-xs text-neutral-500">
            {help}
          </p>
        )}
        {error && (
          <p id={errId} className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

export default TextField;
export { TextField };
