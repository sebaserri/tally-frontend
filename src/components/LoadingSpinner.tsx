export default function LoadingSpinner({ size = 48 }: { size?: number }) {
  const px = `${size}px`;
  return (
    <span
      className="inline-block rounded-full border-[3px] border-current border-r-transparent align-[-0.125em] text-brand motion-reduce:animate-none animate-spin"
      style={{ width: px, height: px }}
      role="status"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando…</span>
    </span>
  );
}
