import clsx from "clsx";

export default function SkeletonLine({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "h-3 w-full rounded-lg bg-neutral-200/70 dark:bg-neutral-800/60",
        "relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:animate-[shimmer_1.4s_infinite]",
        className
      )}
    />
  );
}
