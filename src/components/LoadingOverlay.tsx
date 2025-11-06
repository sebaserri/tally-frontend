import LoadingSpinner from "./LoadingSpinner";

export default function LoadingOverlay() {
  return (
    <div
      className="relative isolate flex min-h-[50vh] w-full items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      {/* fondo suave */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-neutral-950 dark:via-black dark:to-neutral-950" />
      {/* aureola */}
      <div className="pointer-events-none absolute -z-10 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={48} />
        <div className="text-sm text-neutral-500">Preparando la vista…</div>
      </div>
    </div>
  );
}
