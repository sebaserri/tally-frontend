import { useId } from "react";
import { clsx } from "clsx";

export interface PasswordStrengthProps {
  value: string;
  minLength?: number;
  className?: string;
}

function calcScore(pw: string, minLength: number) {
  if (!pw) return 0;
  const len = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^\w\s]/.test(pw);
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(
    Boolean
  ).length;

  // penalizaciones simples
  const repeats = /(.)\1{2,}/.test(pw) ? -0.5 : 0;
  const onlyLetters = /^[A-Za-z]+$/.test(pw) ? -0.5 : 0;
  const onlyDigits = /^\d+$/.test(pw) ? -0.5 : 0;

  let base =
    (len >= minLength ? 1 : len / minLength) * 0.35 +
    (variety / 4) * 0.45 +
    (len >= 12 ? 0.2 : len >= 16 ? 0.3 : 0);

  base += repeats + onlyLetters + onlyDigits;
  base = Math.max(0, Math.min(1, base));
  return Math.round(base * 100);
}

function labelFromScore(pct: number) {
  if (pct < 25) return "Muy débil";
  if (pct < 50) return "Débil";
  if (pct < 75) return "Aceptable";
  if (pct < 90) return "Fuerte";
  return "Excelente";
}

export default function PasswordStrength({
  value,
  minLength = 6,
  className,
}: PasswordStrengthProps) {
  const id = useId();
  const pct = calcScore(value, minLength);
  const label = labelFromScore(pct);

  return (
    <div className={clsx("space-y-1", className)}>
      <div
        role="progressbar"
        aria-label="Fortaleza de contraseña"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-describedby={`${id}-text`}
        className="h-2 w-full rounded bg-neutral-200 dark:bg-neutral-800 overflow-hidden"
      >
        <div
          className={clsx(
            "h-full transition-all",
            pct < 25 && "bg-red-500",
            pct >= 25 && pct < 50 && "bg-amber-500",
            pct >= 50 && pct < 75 && "bg-yellow-500",
            pct >= 75 && pct < 90 && "bg-emerald-500",
            pct >= 90 && "bg-green-600"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p id={`${id}-text`} className="text-xs text-neutral-500">
        {label} • {pct}% • mínimo recomendado {Math.max(8, minLength)}+
      </p>
    </div>
  );
}
