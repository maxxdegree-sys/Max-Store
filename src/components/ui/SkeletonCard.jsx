export default function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square bg-ink-100 dark:bg-white/10 shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-ink-100 dark:bg-white/10 shimmer" />
        <div className="h-3 w-1/2 rounded bg-ink-100 dark:bg-white/10 shimmer" />
        <div className="h-4 w-1/3 rounded bg-ink-100 dark:bg-white/10 shimmer" />
      </div>
    </div>
  );
}
