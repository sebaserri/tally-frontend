import SkeletonLine from "./SkeletonLine";

export default function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="mb-6">
        <SkeletonLine className="h-6 w-56" />
        <SkeletonLine className="mt-3 h-3 w-80" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/60 p-6 backdrop-blur">
          <SkeletonLine className="h-4 w-40" />
          <div className="mt-4 space-y-3">
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine className="w-5/6" />
          </div>
          <div className="mt-6 flex gap-3">
            <SkeletonLine className="h-9 w-28" />
            <SkeletonLine className="h-9 w-20" />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/60 p-6 backdrop-blur">
          <SkeletonLine className="h-4 w-48" />
          <div className="mt-4 space-y-3">
            <SkeletonLine />
            <SkeletonLine className="w-11/12" />
            <SkeletonLine className="w-4/5" />
          </div>
          <div className="mt-6">
            <SkeletonLine className="h-9 w-32" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
